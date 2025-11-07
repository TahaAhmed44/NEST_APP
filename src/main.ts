import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors';
import { setDefaultLanguage } from './common';
import * as express from 'express';
import path from 'path';

async function bootstrap() {
  const port: number | string = process.env.PORT ?? 5000;
  const app = await NestFactory.create(AppModule);

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
