import { Router } from "express";
import type { IRouter } from "@/blueprints";
import { inject, injectable } from "inversify";
import { UserRouter } from "./user.route";
import { AuthRouter } from "./auth.route";
import { MessageRouter } from "./messsage.route";
import { ResendRouter } from "./resend.route";

@injectable()
export class ApiRouter implements IRouter {
  private router: Router;

  constructor(
    @inject(UserRouter)
    private userRouter: UserRouter,
    @inject(AuthRouter)
    private authRouter: AuthRouter,
    @inject(MessageRouter)
    private messageRouter: MessageRouter,
    @inject(ResendRouter)
    private resendRouter: ResendRouter
  ) {
    this.router = Router();
    this.userRouter.createRouters();
    this.authRouter.createRouters();
    this.resendRouter.createRouters();
    this.messageRouter.createRouters();
  }

  createRouters(): void {
    this.router.use("/v1/users", this.userRouter.getRouters());
    this.router.use("/v1/auth", this.authRouter.getRouters());
    this.router.use("/v1/resend", this.resendRouter.getRouters());
    this.router.use("/v1/messages", this.messageRouter.getRouters());
  }

  getRouters(): Router {
    return this.router;
  }
}
