import { Global, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from 'src/common';
import {
  OtpModel,
  OtpRepository,
  TokenModel,
  TokenRepository,
  UserModel,
  UserRepository,
} from 'src/DB';
@Global()
@Module({
  imports: [UserModel, TokenModel],
  controllers: [],
  providers: [UserRepository, TokenRepository, JwtService, TokenService],
  exports: [
    UserModel,
    JwtService,
    UserRepository,
    TokenModel,
    TokenRepository,
    TokenService,
  ],
})
export class SharedAuthenticationModule {}
