import { Router } from "express";
import { asyncHandler } from "@/utils";
import type { IRouter } from "@/blueprints";
import { inject, injectable } from "inversify";
import { ResendController } from "@/controllers";

@injectable()
export class ResendRouter implements IRouter {
  private router: Router;

  constructor(
    @inject(ResendController)
    private resendController: ResendController
  ) {
    this.router = Router();
  }

  createRouters(): void {
    // Configure the webhook in your Resend dashboard:
    // https://resend.com/webhooks
    this.router
      .route("/webhook")
      .post(
        asyncHandler(this.resendController.webhook.bind(this.resendController))
      );
  }

  getRouters(): Router {
    return this.router;
  }
}
