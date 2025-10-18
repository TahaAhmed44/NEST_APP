import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { AuthenticationService} from './auth.service';
import {
  ConfirmEmailDTO,
  LoginBodyDTO,
  ResendConfirmEmailDTO,
  SignupBodyDTO,
} from './dto/auth.dto';
import { LoginResponse } from './entities/auth.entity';

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
  ): Promise<{
    message: string;
  }> {
    console.log({ body });

    await this.authenticationService.signup(body);
    return { message: 'Done' };
  }

  @Post('resend-confirm-email')
  async resendConfirmEmail(
    @Body()
    body: ResendConfirmEmailDTO,
  ): Promise<{
    message: string;
  }> {
    await this.authenticationService.resendConfirmEmail(body);
    return { message: 'Done' };
  }

  @Patch('confirm-email')
  async confirmEmail(
    @Body()
    body: ConfirmEmailDTO,
  ): Promise<{
    message: string;
  }> {
    await this.authenticationService.confirmEmail(body);
    return { message: 'Done' };
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
  ): Promise<LoginResponse> {
    const credentials = await this.authenticationService.login(body);

    return { message: 'Done', data: { credentials } };
  }
}
