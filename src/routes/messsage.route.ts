import type { IRouter } from "@/blueprints";
import { MessageController } from "@/controllers";
import { AuthMiddleware } from "@/middlewares";
import { asyncHandler } from "@/utils";
import { Router } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class MessageRouter implements IRouter {
  private router: Router;

  constructor(
    @inject(MessageController)
    private messageController: MessageController,

    @inject(AuthMiddleware)
    private authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
  }

  createRouters(): void {
    this.router
      .route("/signup/code")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.messageController.resendSignupCodeHandler.bind(
            this.messageController
          )
        )
      );

    this.router
      .route("/verify/signup/code")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.messageController.verifySignupCodeHandler.bind(
            this.messageController
          )
        )
      );

    this.router
      .route("/contacts/phones/:id/code")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.messageController.sendContactPhoneVerificationHandler.bind(
            this.messageController
          )
        )
      );

    this.router
      .route("/contacts/emails/:id/code")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.messageController.sendContactEmailVerificationHandler.bind(
            this.messageController
          )
        )
      );

    this.router
      .route("/verify/contacts/phones/:id")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.messageController.verifyContactPhoneHandler.bind(
            this.messageController
          )
        )
      );

    this.router
      .route("/verify/contacts/emails/:id")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.messageController.verifyContactEmailHandler.bind(
            this.messageController
          )
        )
      );
  }

  getRouters(): Router {
    return this.router;
  }
}
