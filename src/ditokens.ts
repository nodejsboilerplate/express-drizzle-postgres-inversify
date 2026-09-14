import { EmailService } from "./services";

export const DITokens = {
  EmailService: Symbol.for("EmailService"),
  PhoneService: Symbol.for("PhoneService"),
};
