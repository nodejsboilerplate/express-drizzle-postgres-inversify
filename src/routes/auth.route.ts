import { Router } from "express";
import { asyncHandler } from "@/utils";
import { inject, injectable } from "inversify";
import { AuthController } from "@/controllers";
import { AuthMiddleware } from "@/middlewares";
import type { IRouter } from "@/blueprints";

@injectable()
export class AuthRouter implements IRouter {
  private router: Router;

  constructor(
    @inject(AuthController)
    private authController: AuthController,

    @inject(AuthMiddleware)
    private authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
  }

  createRouters(): void {
    this.router
      .route("/signup")
      .post(
        asyncHandler(
          this.authController.signupUserHandler.bind(this.authController)
        )
      );

    this.router
      .route("/login")
      .post(
        asyncHandler(
          this.authController.loginUserHandler.bind(this.authController)
        )
      );

    this.router
      .route("/signin/google")
      .get(
        asyncHandler(
          this.authController.redirectGoogleAuthHandler.bind(
            this.authController
          )
        )
      );
    this.router
      .route("/callback/google")
      .get(
        asyncHandler(
          this.authController.loginWithGoogleHandler.bind(this.authController)
        )
      );

    this.router
      .route("/me")
      .get(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.authController.authUserBasicDataProvider.bind(
            this.authController
          )
        )
      );
  }

  getRouters(): Router {
    return this.router;
  }
}
