import {
  Controller,
  Get,
  Headers,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import type { IAuthRequest } from 'src/common/interface/token.interface';
import { Auth, RoleEnum, successResponse, User } from 'src/common';
import type { UserDocument } from 'src/DB';
import {
  LoggingInterceptor,
  PreferredLanguageInterceptor,
} from 'src/common/interceptors';
import { delay, Observable, of } from 'rxjs';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload, multerValidation } from 'src/common/utils/multer';
import type { IResponse } from 'src/common';
import { ProfileImageResponse } from './entities/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseInterceptors(PreferredLanguageInterceptor, LoggingInterceptor)
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

  @UseInterceptors(
    FileInterceptor(
      'profileImage',
      cloudFileUpload({
        validation: multerValidation.image,
      }),
    ),
  )
  @Auth([RoleEnum.user])
  @Patch('profile-image')
  async profileImage(
    @User() user: UserDocument,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<ProfileImageResponse>> {
    const url = await this.userService.profileImage(file, user);
    return successResponse<ProfileImageResponse>({ data: { url } });
  }

  // @UseInterceptors(
  //   FilesInterceptor(
  //     'coverImages',
  //     2,
  //     localFileUpload({ folder: 'User', validation: multerValidation.image }),
  //   ),
  // )
  // @Auth([RoleEnum.user])
  // @Patch('cover-image')
  // coverImage(@UploadedFiles(ParseFilePipe) files: Array<IMulterFile>) {
  //   return { message: 'Done', files };
  // }

  // @UseInterceptors(
  //   FileFieldsInterceptor(
  //     [
  //       {
  //         name: 'profileImage',
  //         maxCount: 1,
  //       },
  //       {
  //         name: 'coverImages',
  //         maxCount: 2,
  //       },
  //     ],
  //     localFileUpload({ folder: 'User', validation: multerValidation.image }),
  //   ),
  // )
  // @Auth([RoleEnum.user])
  // @Patch('images')
  // images(
  //   @UploadedFiles(ParseFilePipe)
  //   files: {
  //     profileImage: Array<IMulterFile>;
  //     coverImage: Array<IMulterFile>;
  //   },
  // ) {
  //   return { message: 'Done', files };
  // }
}
