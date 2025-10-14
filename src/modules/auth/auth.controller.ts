import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthenticationService, IUser } from './auth.service';
import { SignupBodyDTO } from './dto/auth.dto';
import { CustomValidationPipe } from 'src/common/pipes/validation.custom.pipe';
import { signupValidation } from './auth.validation';

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
}
