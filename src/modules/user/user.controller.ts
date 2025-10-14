import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { IUser } from '../auth/auth.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile/:userId')
  profile(@Param('userId') userId: string): {
    message: string;
    profile: IUser;
  } {
    const profile = this.userService.profile(userId);
    return { message: 'Done', profile };
  }
}
