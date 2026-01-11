import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { StoresModule } from './modules/stores/stores.module';
import { GlobalJwtAuthGuard } from './common/guards/global-jwt-auth.guard';
import { PrismaModule } from './common/prisma';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    StoresModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalJwtAuthGuard,
    },
  ],
})
export class AppModule {}
