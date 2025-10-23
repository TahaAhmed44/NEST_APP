import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TokenService } from 'src/common';
import { JwtService } from '@nestjs/jwt';
import { TokenModel, TokenRepository, UserModel, UserRepository } from 'src/DB';

@Module({
  imports: [UserModel, TokenModel],
  exports: [],
  controllers: [UserController],
  providers: [
    UserService,
    TokenService,
    JwtService,
    UserRepository,
    TokenRepository,
  ],
})
export class UserModule {}
