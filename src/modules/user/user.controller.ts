import { Controller, Get, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import type { IAuthRequest } from 'src/common/interface/token.interface';
import { Auth, RoleEnum } from 'src/common';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth([RoleEnum.user])
  @Get('profile')
  profile(@Req() req: IAuthRequest): { message: string } {
    console.log({
      lang: req.headers['accept-language'],
      credentials: req.credentials,
    });

    return { message: 'Done' };
  }

  @Post('test')
  test(@Req() req: IAuthRequest): { message: string } {
    console.log(
      // lang: req.headers['accept-language'],
      // credentials: req.credentials,
      'Test Good',
    );

    return { message: 'Done' };
  }
}
