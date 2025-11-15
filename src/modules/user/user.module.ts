import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { preAuth } from 'src/common/middleware/authentication.middleware';
import { S3Service } from 'src/common';

@Module({
  exports: [],
  controllers: [UserController],
  providers: [UserService, S3Service],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(preAuth).forRoutes(UserController);
  }
}
