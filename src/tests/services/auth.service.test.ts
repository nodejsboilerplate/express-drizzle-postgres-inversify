import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthService } from "@/services/auth";
import { TokenService } from "@/services/auth/token.service";
import { UserService } from "@/services";
import { AuthRedis } from "@/redis";
import { UserRepository } from "@/database/repositories";
import { UserInputValidators } from "@/validators/inputs";
import { DITokens } from "@/ditokens";
import { container } from "@/container";

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
    it("resolves the manual and Google auth helpers from the container", () => {
      expect(authService.manualAuth).toBeDefined();
      expect(authService.googleOAuth).toBeDefined();
      expect(authService.manualAuth).toBeInstanceOf(Object);
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