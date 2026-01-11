import 'dotenv/config'; // Load environment variables FIRST
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
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

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Multi-Tenant API')
    .setDescription('Multi-tenant store management system with RBAC')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching with @ApiBearerAuth() in controllers
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-store-id',
        in: 'header',
        description: 'Store ID for multi-tenant context',
      },
      'store-id',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-subdomain',
        in: 'header',
        description: 'Store subdomain for multi-tenant context',
      },
      'subdomain',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
