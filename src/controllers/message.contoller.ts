import type { IEmailService, IPhoneMessageService } from "@/blueprints";
import { DITokens } from "@/ditokens";
import { getSystemCustomErrorMsgByKey } from "@/events";
import { ApiError, ApiResponse } from "@/libs";
import { VerificationService } from "@/services";
import type {
  UserIdWithContextIdInputType,
  VerifyCodeInputType,
  VerifyCodeWithUserIdInput,
} from "@/zod";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class MessageController {
  constructor(
    @inject(DITokens.EmailService)
    private emailService: IEmailService,
    @inject(DITokens.PhoneService)
    private phoneService: IPhoneMessageService,
    @inject(VerificationService)
    private verificationService: VerificationService
  ) {}

  async resendSignupCodeHandler(
    req: Request,
    res: Response
  ): Promise<Response> {
    const result = await this.emailService.sendSignupCode(
      req.auth_user.email,
      req?.headers["user-agent"] ?? "Unknown device"
    );

    return res.status(200).json(
      new ApiResponse(200, "Verification code sent successfully.", {
        id: result,
      })
    );
  }

  async verifySignupCodeHandler(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { verify_code } = req.body as Pick<
      VerifyCodeInputType,
      "verify_code"
    >;

    if (req.auth_user.is_verified) {
      throw new ApiError(
        400,
        getSystemCustomErrorMsgByKey("USER_ALREADY_VERIFIED")
      );
    }

    const result = await this.verificationService.verifySignupCode({
      verify_code,
      id: req.auth_user.id,
    });

    return res.status(200).json(
      new ApiResponse(200, "Account verified successfully.", {
        id: result,
      })
    );
  }

  async sendContactPhoneVerificationHandler(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params as Pick<UserIdWithContextIdInputType, "id">;
    const result = await this.phoneService.sendContactPhoneVerificationCode({
      id,
      user_id: req.auth_user.id,
    });

    return res.status(200).json(
      new ApiResponse(200, "Verification code sent successfully.", {
        id: result,
      })
    );
  }

  async sendContactEmailVerificationHandler(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params as Pick<UserIdWithContextIdInputType, "id">;
    const result = await this.emailService.sendContactEmailVerificationCode(
      {
        id,
        user_id: req.auth_user.id,
      },
      req?.headers["user-agent"] ?? "Unknown device"
    );

    return res.status(200).json(
      new ApiResponse(200, "Verification code sent successfully.", {
        id: result,
      })
    );
  }

  async verifyContactPhoneHandler(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params as Pick<VerifyCodeWithUserIdInput, "id">;
    const { verify_code } = req.body as Pick<
      VerifyCodeWithUserIdInput,
      "verify_code"
    >;

    const result = await this.verificationService.verifyContactPhone({
      id,
      user_id: req.auth_user.id,
      verify_code,
    });

    return res.status(200).json(
      new ApiResponse(200, "Phone number verified successfully.", {
        id: result,
      })
    );
  }

  async verifyContactEmailHandler(
    req: Request,
    res: Response
  ): Promise<Response> {
    const { id } = req.params as Pick<VerifyCodeWithUserIdInput, "id">;
    const { verify_code } = req.body as Pick<
      VerifyCodeWithUserIdInput,
      "verify_code"
    >;

    const result = await this.verificationService.verifyContactEmail({
      id,
      user_id: req.auth_user.id,
      verify_code,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Email verified successfully.", { id: result })
      );
  }
}
