import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { preAuth } from 'src/common/middleware/authentication.middleware';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Request } from 'express';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination(
    //       req: Request,
    //       file: Express.Multer.File,
    //       callback: Function,
    //     ) {
    //       callback(null, './uploads');
    //     },
    //     filename(req: Request, file: Express.Multer.File, callback: Function) {
    //       const fileName =
    //         randomUUID() + '_' + Date.now() + '_' + file.originalname;
    //       callback(null, fileName);
    //     },
    //   }),
    // }),
  ],
  exports: [],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(preAuth).forRoutes(UserController);
  }
}
