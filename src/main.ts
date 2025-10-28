import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';
import { setDefaultLanguage } from './common';
import * as express from 'express';
import path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
async function bootstrap() {
  const port: number | string = process.env.PORT ?? 5000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  console.log(path.resolve('./uploads'));

  // app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads/',
  // });

  app.use('/uploads', express.static(path.resolve('./uploads')));

  app.use(setDefaultLanguage);
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(port, () => {
    console.log(`server is running on port::: ${port}`);
  });
}
bootstrap();
