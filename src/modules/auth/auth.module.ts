import { Module } from "@nestjs/common";
import { OtpModel, OtpRepository, TokenModel, TokenRepository, UserModel, UserRepository } from "src/DB";
import { AuthenticationController } from "./auth.controller";
import { AuthenticationService } from "./auth.service";
import { JwtService } from "@nestjs/jwt";
import { TokenService } from "src/common";


@Module({
  imports: [UserModel, OtpModel, TokenModel],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    UserRepository,
    TokenRepository,
    OtpRepository,
    JwtService,
    TokenService,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
