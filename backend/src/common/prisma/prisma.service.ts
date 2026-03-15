import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const parsedPort = Number(process.env.DATABASE_PORT || 3306);

    // Kiểm tra environment variables
    const dbConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number.isNaN(parsedPort) ? 3306 : parsedPort,
      user: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      connectionLimit: 10,
      allowPublicKeyRetrieval: true,
      ssl: false,
    };

    // Log configuration (ẩn password)
    console.log('Prisma Database Configuration:');
    console.log('Host:', dbConfig.host);
    console.log('Port:', dbConfig.port);
    console.log('User:', dbConfig.user || 'NOT SET');
    console.log('Password:', dbConfig.password ? 'SET (hidden)' : 'NOT SET');
    console.log('Database:', dbConfig.database || 'NOT SET');

    if (!dbConfig.user || !dbConfig.password || !dbConfig.database) {
      throw new Error(
        '❌ Missing required database configuration. Please check your .env file.',
      );
    }

    // Tạo adapter cho MySQL
    const adapter = new PrismaMariaDb(dbConfig);

    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
