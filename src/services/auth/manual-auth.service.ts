import type { CreateUserWithProfileInputType, LoginUserInputType } from "@/zod";
import { UserInputValidators } from "@/validators/inputs";
import { isZodError, validationError } from "@/utils";
import { getSystemCustomErrorMsgByKey } from "@/events";
import { ApiError } from "@/libs";
import bcrypt from "bcryptjs";
import { AuthRedis } from "@/redis";
import { UserRepository } from "@/database/repositories";
import { UserService } from "../user.service";
import type { IEmailService } from "@/blueprints";
import { TokenService } from "./token.service";
import { inject, injectable } from "inversify";
import { DITokens } from "@/ditokens";

@injectable()
export class ManualAuthService {
  constructor(
    @inject(UserRepository)
    private userRepository: UserRepository,
    @inject(UserService)
    private userService: UserService,
    @inject(AuthRedis)
    private authRedis: AuthRedis,
    @inject(UserInputValidators)
    private userInputValidators: UserInputValidators,
    @inject(DITokens.EmailService)
    private emailService: IEmailService,
    @inject(TokenService)
    private tokenService: TokenService
  ) {}

  async loginByManual(
    payload: LoginUserInputType,
    deviceInfo: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const parse_payload = this.userInputValidators.loginUserInput(payload);

    if (isZodError(parse_payload)) throw validationError(parse_payload);

    const result =
      await this.userRepository.GetUserDataForLoginByEmailOrUsernameOrId(
        parse_payload.identifier
      );

    if (!result?.id) {
      throw new ApiError(404, getSystemCustomErrorMsgByKey("USER_NOT_FOUND"));
    }

    const isPassMatched = await bcrypt.compare(
      parse_payload.password,
      result.password as string
    );

    if (!isPassMatched) {
      throw new ApiError(401, getSystemCustomErrorMsgByKey("UNAUTHORIZED"));
    }

    const { password, profile, ...rest } = result;

    const { tokenData, profileData } =
      this.tokenService.finalLoginResponseUserData(rest, profile!);

    const { accessToken, refreshToken } =
      this.tokenService.createTokens(tokenData);

    await this.authRedis.cacheUserLoginData(result?.id as string, {
      ...tokenData,
      ...profileData,
    });

    if (!result.is_verified)
      await this.emailService.sendSignupCode(result.email, deviceInfo);

    return {
      accessToken,
      refreshToken,
    };
  }

  async signupByManual(
    payload: CreateUserWithProfileInputType,
    deviceInfo: string
  ) {
    const result = await this.userService.createUserWithProfile(payload);
    const { user, profile } = result;

    const { tokenData, profileData } =
      this.tokenService.finalLoginResponseUserData(user, profile!);

    const tokens = this.tokenService.createTokens(tokenData);

    await this.authRedis.cacheUserLoginData(user?.id as string, {
      ...tokenData,
      ...profileData,
    });
    await this.emailService.sendSignupCode(user.email, deviceInfo);

    return {
      tokens,
      user_id: user.id,
    };
  }
}
