import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { injectable, inject } from "inversify";
import { AuthService } from "@/services/auth";
import { TokenService } from "@/services/auth/token.service";
import { UserService } from "@/services";
import { AuthRedis } from "@/redis";
import { UserRepository } from "@/database/repositories";
import { UserInputValidators } from "@/validators/inputs";
import { DITokens } from "@/ditokens";
import { container } from "@/container";

const mocks = vi.hoisted(() => ({
  manualAuthCtor: vi.fn(),
  googleOAuthCtor: vi.fn(),
}));

// The real ManualAuthService/GoogleOAuthService take POSITIONAL, individually
// @inject()-decorated constructor params (see the real source files) — the
// container resolves each one independently, it never hands them a single
// bundled "deps" object. To capture what the container actually wired in,
// these fakes must mirror that same decorated, positional shape and only
// bundle the args into an object afterwards, for the assertions below.
vi.mock("@/services/auth/manual-auth.service", () => {
  @injectable()
  class ManualAuthService {
    constructor(
      @inject(UserRepository) userRepository: unknown,
      @inject(UserService) userService: unknown,
      @inject(AuthRedis) authRedis: unknown,
      @inject(UserInputValidators) userInputValidators: unknown,
      @inject(DITokens.EmailService) emailService: unknown,
      @inject(TokenService) tokenService: unknown
    ) {
      mocks.manualAuthCtor({
        userRepository,
        userService,
        authRedis,
        userInputValidators,
        emailService,
        tokenService,
      });
    }
  }
  return { ManualAuthService };
});

vi.mock("@/services/auth/google-auth.service", () => {
  @injectable()
  class GoogleOAuthService {
    constructor(
      @inject(AuthRedis) authRedis: unknown,
      @inject(DITokens.EmailService) emailService: unknown,
      @inject(UserService) userService: unknown,
      @inject(TokenService) tokenService: unknown
    ) {
      mocks.googleOAuthCtor({
        authRedis,
        emailService,
        userService,
        tokenService,
      });
    }
  }
  return { GoogleOAuthService };
});

vi.mock("@/events", () => ({
  getSystemCustomErrorMsgByKey: (key: string) => key,
}));

vi.mock("@/libs", () => ({
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  },
}));

const buildDeps = () => ({
  authRedis: {
    getCachedLoginData: vi.fn(),
    cacheUserLoginData: vi.fn(),
  },
  emailService: {
    sendSignupCode: vi.fn(),
    sendContactEmailVerificationCode: vi.fn(),
  },
  tokenService: {
    finalLoginResponseUserData: vi.fn(),
  },
  userInputValidators: {},
  userRepository: {
    GetUserDataForLoginByEmailOrUsernameOrId: vi.fn(),
  },
  userService: {},
});

describe("AuthService", () => {
  let deps: ReturnType<typeof buildDeps>;
  let authService: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    deps = buildDeps();

    // Without rebinding, container.get(AuthService) resolves the real
    // AuthRedis/UserRepository/TokenService/UserInputValidators/UserService/
    // EmailService bindings, and the mocks above are never actually wired in.
    container.snapshot();
    container.rebind(AuthRedis).toConstantValue(deps.authRedis as any);
    container.rebind(UserRepository).toConstantValue(deps.userRepository as any);
    container.rebind(TokenService).toConstantValue(deps.tokenService as any);
    container
      .rebind(UserInputValidators)
      .toConstantValue(deps.userInputValidators as any);
    container.rebind(UserService).toConstantValue(deps.userService as any);
    container
      .rebind(DITokens.EmailService)
      .toConstantValue(deps.emailService as any);

    authService = container.get(AuthService);
  });

  afterEach(() => {
    container.restore();
  });

  // -------------------------------------------------------
  describe("construction / wiring", () => {
    it("constructs manualAuth with authRedis, emailService, tokenService, userInputValidators, userRepository, userService", () => {
      expect(mocks.manualAuthCtor).toHaveBeenCalledWith(
        expect.objectContaining({
          authRedis: deps.authRedis,
          emailService: deps.emailService,
          tokenService: deps.tokenService,
          userInputValidators: deps.userInputValidators,
          userRepository: deps.userRepository,
          userService: deps.userService,
        })
      );
      expect(authService.manualAuth).toBeInstanceOf(Object);
    });

    it("constructs googleOAuth with authRedis, emailService, userService, tokenService", () => {
      expect(mocks.googleOAuthCtor).toHaveBeenCalledWith(
        expect.objectContaining({
          authRedis: deps.authRedis,
          emailService: deps.emailService,
          userService: deps.userService,
          tokenService: deps.tokenService,
        })
      );
      expect(authService.googleOAuth).toBeInstanceOf(Object);
    });
  });

  // -------------------------------------------------------
  describe("getAuthUserData", () => {
    it("returns the cached data directly on a Redis cache hit", async () => {
      const cached = {
        id: "u1",
        email: "a@b.com",
        username: "rahim_uddin",
        is_verified: true,
        avatar: "https://cdn.example.com/a.png",
        first_name: "Rahim",
        last_name: "Uddin",
        nickname: "Ray",
      };
      deps.authRedis.getCachedLoginData.mockResolvedValueOnce(
        JSON.stringify(cached)
      );

      const result = await authService.getAuthUserData("u1");

      expect(result).toEqual(cached);
      expect(
        deps.userRepository.GetUserDataForLoginByEmailOrUsernameOrId
      ).not.toHaveBeenCalled();
      expect(deps.authRedis.cacheUserLoginData).not.toHaveBeenCalled();
    });

    it("falls back to the repository + caches the result on a cache miss", async () => {
      deps.authRedis.getCachedLoginData.mockResolvedValueOnce(null);
      deps.userRepository.GetUserDataForLoginByEmailOrUsernameOrId.mockResolvedValueOnce(
        {
          id: "u1",
          email: "a@b.com",
          username: "rahim_uddin",
          is_verified: true,
          profile: {
            first_name: "Rahim",
            last_name: "Uddin",
            avatar: "avatar.png",
            nickname: "Ray",
          },
        }
      );
      deps.tokenService.finalLoginResponseUserData.mockReturnValueOnce({
        tokenData: {
          id: "u1",
          email: "a@b.com",
          username: "rahim_uddin",
          is_verified: true,
        },
        profileData: {
          first_name: "Rahim",
          last_name: "Uddin",
          avatar: "avatar.png",
          nickname: "Ray",
        },
      });

      const result = await authService.getAuthUserData("u1");

      expect(
        deps.userRepository.GetUserDataForLoginByEmailOrUsernameOrId
      ).toHaveBeenCalledWith("u1");
      expect(deps.authRedis.cacheUserLoginData).toHaveBeenCalledWith(
        "u1",
        expect.objectContaining({ id: "u1", first_name: "Rahim" })
      );
      expect(result).toEqual({
        id: "u1",
        email: "a@b.com",
        username: "rahim_uddin",
        is_verified: true,
        first_name: "Rahim",
        last_name: "Uddin",
        avatar: "avatar.png",
        nickname: "Ray",
      });
    });

    it("throws 401 when the user cannot be found in the repository", async () => {
      deps.authRedis.getCachedLoginData.mockResolvedValueOnce(null);
      deps.userRepository.GetUserDataForLoginByEmailOrUsernameOrId.mockResolvedValueOnce(
        undefined
      );

      await expect(authService.getAuthUserData("u1")).rejects.toThrow(
        "UNAUTHORIZED"
      );
      expect(deps.authRedis.cacheUserLoginData).not.toHaveBeenCalled();
    });
  });
});