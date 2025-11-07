import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticationService } from './auth.service';
import {
  ConfirmEmailDTO,
  LoginBodyDTO,
  ResendConfirmEmailDTO,
  SignupBodyDTO,
} from './dto/auth.dto';
import { LoginResponse } from './entities/auth.entity';
import { IResponse, successResponse } from 'src/common';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('signup')
  async signup(
    @Body(
      new ValidationPipe({
        stopAtFirstError: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: SignupBodyDTO,
  ): Promise<IResponse> {
    await this.authenticationService.signup(body);
    return successResponse({ status: 201 });
  }

  @Post('resend-confirm-email')
  async resendConfirmEmail(
    @Body()
    body: ResendConfirmEmailDTO,
  ): Promise<IResponse> {
    await this.authenticationService.resendConfirmEmail(body);
    return successResponse();
  }

  @Patch('confirm-email')
  async confirmEmail(
    @Body()
    body: ConfirmEmailDTO,
  ): Promise<IResponse> {
    await this.authenticationService.confirmEmail(body);
    return successResponse();
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(
      new ValidationPipe({
        stopAtFirstError: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    body: LoginBodyDTO,
  ): Promise<IResponse<LoginResponse>> {
    const credentials = await this.authenticationService.login(body);

    return successResponse<LoginResponse>({ data: { credentials } });
  }
}
