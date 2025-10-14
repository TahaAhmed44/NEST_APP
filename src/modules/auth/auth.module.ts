import { Module } from '@nestjs/common';
import { AuthenticationController } from './auth.controller';
import { AuthenticationService } from './auth.service';
import { UserModel, UserRepository } from 'src/DB';

@Module({
  imports: [UserModel],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, UserRepository],
  exports: [],
})
export class AuthenticationModule {}
