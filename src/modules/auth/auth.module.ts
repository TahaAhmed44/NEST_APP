import { Module } from '@nestjs/common';
import { AuthenticationController } from './auth.controller';
import { AuthenticationService } from './auth.service';
import { OtpModel, OtpRepository } from 'src/DB';

@Module({
  imports: [OtpModel],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, OtpRepository],
  exports: [],
})
export class AuthenticationModule {}
