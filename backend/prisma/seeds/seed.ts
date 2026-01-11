import { PrismaService } from '../../src/common/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaService();

// Hàm hash mật khẩu
async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'manage', Subject: 'all' } },
    update: {},
    create: { Action: 'manage', Subject: 'all' }, //(Super Admin)
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'Product' } },
    update: {},
    create: { Action: 'read', Subject: 'Product' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'create', Subject: 'Product' } },
    update: {},
    create: { Action: 'create', Subject: 'Product' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'Order' } },
    update: {},
    create: { Action: 'read', Subject: 'Order' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'create', Subject: 'Order' } },
    update: {},
    create: { Action: 'create', Subject: 'Order' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'CostPrice' } },
    update: {},
    create: { Action: 'read', Subject: 'CostPrice' }, // Xem giá vốn
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'ProfitReport' } },
    update: {},
    create: { Action: 'read', Subject: 'ProfitReport' }, // Xem báo cáo lợi nhuận
  });

  // Tạo User Admin mẫu
  console.log('Seeding Admin User...');
  const adminPassword = await hashPassword('123456');
  const adminUser = await prisma.user.upsert({
    where: { Email: 'admin@app.com' },
    update: {},
    create: {
      Email: 'admin@app.com',
      FullName: 'Admin User',
      PasswordHash: adminPassword,
    },
  });

  // Tạo Cửa hàng mẫu
  console.log('Seeding Test Store...');
  const testStore = await prisma.store.upsert({
    where: { Subdomain: 'test' },
    update: {},
    create: {
      StoreName: 'Cửa hàng A',
      Subdomain: 'test',
      Address: '79 Cầu Giấy, Hà Nội',
      Phone: '0123456789',
    },
  });

  // Tạo 2 roles cho Cửa hàng mẫu
  console.log('Seeding Roles...');
  const ownerRole = await prisma.role.upsert({
    where: {
      StoreID_RoleName: {
        StoreID: testStore.StoreID,
        RoleName: 'Chủ cửa hàng',
      },
    },
    update: {},
    create: {
      StoreID: testStore.StoreID,
      RoleName: 'Chủ cửa hàng',
      Description: 'Toàn quyền quản lý cửa hàng',
      // Gán quyền "manage all" cho vai trò này
      rolePermissions: {
        create: {
          permission: {
            connect: { Action_Subject: { Action: 'manage', Subject: 'all' } },
          },
        },
      },
    },
  });

  const staffRole = await prisma.role.upsert({
    where: {
      StoreID_RoleName: { StoreID: testStore.StoreID, RoleName: 'Nhân viên' },
    },
    update: {},
    create: {
      StoreID: testStore.StoreID,
      RoleName: 'Nhân viên',
      Description: 'Vai trò nhân viên bán hàng/kho',
      // Gán các quyền cơ bản 
      rolePermissions: {
        create: [
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'read', Subject: 'Product' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'create', Subject: 'Product' },
              },
            },
          },
          {
            permission: {
              connect: { Action_Subject: { Action: 'read', Subject: 'Order' } },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'create', Subject: 'Order' },
              },
            },
          },
        ],
      },
    },
  });

  // Liên kết Admin User với Cửa hàng Mẫu (với vai trò Chủ cửa hàng)
  console.log('Linking Admin User to Store...');
  await prisma.storeUser.upsert({
    where: {
      StoreID_UserID: { StoreID: testStore.StoreID, UserID: adminUser.UserID },
    },
    update: {},
    create: {
      StoreID: testStore.StoreID,
      UserID: adminUser.UserID,
      RoleID: ownerRole.RoleID,
    },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    if (e instanceof Error) {
      console.error('Seeding error:', e.message);
    } else {
      console.error('Seeding error with unknown error:', String(e));
    }

    await prisma.$disconnect();
    process.exit(1);
  });
