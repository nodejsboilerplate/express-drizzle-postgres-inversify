import { AuthRedis } from "@/redis";
import { GoogleOAuthService } from "./google-auth.service";
import { ManualAuthService } from "./manual-auth.service";
import { UserRepository } from "@/database/repositories";
import { TokenService } from "./token.service";
import type { UserBasicInfoDataType } from "@/types";
import { getSystemCustomErrorMsgByKey } from "@/events";
import { ApiError } from "@/libs";
import { inject, injectable } from "inversify";

@injectable()
export class AuthService {
  constructor(
    @inject(AuthRedis)
    private authRedis: AuthRedis,
    @inject(UserRepository)
    private userRepository: UserRepository,
    @inject(TokenService)
    private tokenService: TokenService,
    @inject(ManualAuthService)
    public manualAuth: ManualAuthService,
    @inject(GoogleOAuthService)
    public googleOAuth: GoogleOAuthService
  ) {}

  async getAuthUserData(id: string) {
    let temp_user: UserBasicInfoDataType;

    const get_cached_data = await this.authRedis.getCachedLoginData(id);
    const parse_data = JSON.parse(
      String(get_cached_data)
    ) as UserBasicInfoDataType;

    if (!parse_data) {
      const existedUser =
        await this.userRepository.GetUserDataForLoginByEmailOrUsernameOrId(id);
      if (!existedUser?.id) {
        throw new ApiError(401, getSystemCustomErrorMsgByKey("UNAUTHORIZED"));
      }

      const { tokenData, profileData } =
        this.tokenService.finalLoginResponseUserData(
          existedUser,
          existedUser.profile!
        );

      await this.authRedis.cacheUserLoginData(existedUser?.id as string, {
        ...tokenData,
        ...profileData,
      });

      temp_user = {
        ...tokenData,
        ...profileData,
      };
    } else {
      temp_user = parse_data;
    }

    return temp_user;
  }
}
