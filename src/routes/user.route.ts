import { Router } from "express";
import { asyncHandler } from "@/utils";
import type { IRouter } from "@/blueprints";
import { inject, injectable } from "inversify";
import { UserController } from "@/controllers";
import { AuthMiddleware } from "@/middlewares";

@injectable()
export class UserRouter implements IRouter {
  private router: Router;

  constructor(
    @inject(UserController)
    private userController: UserController,
    @inject(AuthMiddleware)
    private authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
  }

  createRouters(): void {
    // ---------------------------------------------------------
    // Create
    // ---------------------------------------------------------
    this.router
      .route("/addresses")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.createAddressHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.createContactHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts/:id/phones")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.createPhoneHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts/:id/emails")
      .post(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.createEmailHandler.bind(this.userController)
        )
      );

    // ---------------------------------------------------------
    // Read
    // ---------------------------------------------------------
    this.router
      .route("/profile")
      .get(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.getUserProfileHandler.bind(this.userController)
        )
      );

    // ---------------------------------------------------------
    // Update
    // ---------------------------------------------------------
    this.router
      .route("/profile")
      .patch(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.updateProfileHandler.bind(this.userController)
        )
      );

    this.router
      .route("/addresses/:id")
      .patch(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.updateAddressHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts")
      .patch(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.updateContactHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts/phones/:id")
      .patch(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.updatePhoneHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts/emails/:id")
      .patch(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.updateEmailHandler.bind(this.userController)
        )
      );

    // ---------------------------------------------------------
    // Delete
    // ---------------------------------------------------------
    this.router
      .route("/")
      .delete(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.deleteUserHandler.bind(this.userController)
        )
      );

    this.router
      .route("/addresses/:id")
      .delete(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.deleteAddressHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts/:id")
      .delete(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.deleteContactHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts/phones/:id")
      .delete(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.deletePhoneHandler.bind(this.userController)
        )
      );

    this.router
      .route("/contacts/emails/:id")
      .delete(
        this.authMiddleware.basicAuth.bind(this.authMiddleware),
        asyncHandler(
          this.userController.deleteEmailHandler.bind(this.userController)
        )
      );
  }

  getRouters(): Router {
    return this.router;
  }
}
