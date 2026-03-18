import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DebtsModule } from './modules/debts/debts.module';
import { GlobalJwtAuthGuard } from './common/guards/global-jwt-auth.guard';
import { PermissionGuard } from './common/guards/permission.guard';
import { PrismaModule } from './common/prisma';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RolesModule,
    PermissionsModule,
    StoresModule,
    ProductsModule,
    CategoriesModule,
    SuppliersModule,
    InventoryModule,
    CustomersModule,
    OrdersModule,
    ReportsModule,
    DebtsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalJwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AppModule {}
