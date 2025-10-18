import { LoginCredentialsResponse } from "src/common";

export class LoginResponse {
  message: 'Done';
  data: { credentials: LoginCredentialsResponse };
}
