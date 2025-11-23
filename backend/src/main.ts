import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ properties không có trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu có property thừa
      transform: true, // Tự động transform plain object thành DTO class
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
