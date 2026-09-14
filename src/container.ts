import { Container } from "inversify";
import {
  EmailService,
  PhoneMessagingService,
  ResendService,
  TwilioService,
  UserService,
  VerificationService,
} from "./services";
import {
  AuthService,
  GoogleOAuthService,
  ManualAuthService,
  TokenService,
} from "./services/auth";
import type { IEmailService, IPhoneMessageService } from "./blueprints";
import { DITokens } from "./ditokens";
import { UserInputValidators } from "./validators/inputs";
import { AuthRedis } from "./redis";
import {
  AuthController,
  MessageController,
  ResendController,
  UserController,
} from "./controllers";
import { AuthRouter } from "./routes/auth.route";
import { MessageRouter } from "./routes/messsage.route";
import { UserRouter } from "./routes/user.route";
import { ResendRouter } from "./routes/resend.route";
import { ApiRouter } from "./routes";
import { UserRepository } from "./database/repositories";
import { AuthMiddleware } from "./middlewares";

export const container = new Container();

// Repository
container.bind(UserRepository).toSelf().inSingletonScope();

// Services
container.bind(UserService).toSelf().inRequestScope();

container.bind(AuthService).toSelf();
container.bind(ManualAuthService).toSelf().inRequestScope();
container.bind(GoogleOAuthService).toSelf().inRequestScope();
container.bind(TokenService).toSelf().inRequestScope();

container.bind(TwilioService).toSelf().inSingletonScope();
container.bind(ResendService).toSelf().inSingletonScope();
container
  .bind<IEmailService>(DITokens.EmailService)
  .to(EmailService)
  .inRequestScope();
container
  .bind<IPhoneMessageService>(DITokens.PhoneService)
  .to(PhoneMessagingService)
  .inRequestScope();

container.bind(VerificationService).toSelf();

// Validators
container.bind(UserInputValidators).toSelf().inRequestScope();

// Redis
container.bind(AuthRedis).toSelf().inRequestScope();

// Controllers
container.bind(AuthController).toSelf().inSingletonScope();
container.bind(MessageController).toSelf().inSingletonScope();
container.bind(ResendController).toSelf().inSingletonScope();
container.bind(UserController).toSelf().inSingletonScope();

// Routers
container.bind(AuthRouter).toSelf().inSingletonScope();
container.bind(MessageRouter).toSelf().inSingletonScope();
container.bind(ResendRouter).toSelf().inSingletonScope();
container.bind(UserRouter).toSelf().inSingletonScope();
container.bind(ApiRouter).toSelf().inSingletonScope();

// Middlewares
container.bind(AuthMiddleware).toSelf().inSingletonScope();
