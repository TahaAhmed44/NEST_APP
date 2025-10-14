import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const port: number | string = process.env.PORT ?? 5000;
  const app = await NestFactory.create(AppModule);
  await app.listen(port, () => {
    console.log(`server is running on port::: ${port}`);
  });
}
bootstrap();
