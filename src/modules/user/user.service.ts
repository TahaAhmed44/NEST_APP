import { Injectable } from '@nestjs/common';
import { S3Service } from 'src/common';
import { UserDocument } from 'src/DB';

@Injectable()
export class UserService {
  constructor(private readonly s3Service: S3Service) {}

  async profileImage(
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<string> {
    user.profileImage = await this.s3Service.uploadFile({
      file,
      path: `user/${user._id}`,
    });
    await user.save();
    return user.profileImage;
  }
}
