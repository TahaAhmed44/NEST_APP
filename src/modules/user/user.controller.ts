import {
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import type { IAuthRequest } from 'src/common/interface/token.interface';
import { Auth, RoleEnum, User } from 'src/common';
import type { UserDocument } from 'src/DB';
import { PreferredLanguageInterceptor } from 'src/common/interceptors';
import { delay, Observable, of } from 'rxjs';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(PreferredLanguageInterceptor)
  @Auth([RoleEnum.user])
  @Get('profile')
  profile(@Headers() header: any, @User() user: UserDocument): Observable<any> {
    console.log({ user, lang: header['accept-language'] });
    return of([{ message: 'Done' }]).pipe(delay(2000));
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
