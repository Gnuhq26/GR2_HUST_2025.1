import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';

// Tạo PrismaClient với adapter giống như PrismaService
const dbConfig = {
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10,
};

console.log('Host:', dbConfig.host);
console.log('User:', dbConfig.user || 'NOT SET');
console.log('Password:', dbConfig.password ? 'SET (hidden)' : 'NOT SET');
console.log('Database:', dbConfig.database || 'NOT SET');

if (!dbConfig.user || !dbConfig.password || !dbConfig.database) {
  throw new Error('Missing required database configuration. Please check your .env file.');
}

const adapter = new PrismaMariaDb(dbConfig);
const prisma = new PrismaClient({ adapter });

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
    where: { Action_Subject: { Action: 'update', Subject: 'Product' } },
    update: {},
    create: { Action: 'update', Subject: 'Product' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'delete', Subject: 'Product' } },
    update: {},
    create: { Action: 'delete', Subject: 'Product' },
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
    where: { Action_Subject: { Action: 'read', Subject: 'Report' } },
    update: {},
    create: { Action: 'read', Subject: 'Report' }, // Xem báo cáo doanh thu, top sản phẩm
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'ProfitReport' } },
    update: {},
    create: { Action: 'read', Subject: 'ProfitReport' }, // Xem báo cáo lợi nhuận
  });

  // Supplier Permissions (Giai đoạn 8)
  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'Supplier' } },
    update: {},
    create: { Action: 'read', Subject: 'Supplier' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'create', Subject: 'Supplier' } },
    update: {},
    create: { Action: 'create', Subject: 'Supplier' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'update', Subject: 'Supplier' } },
    update: {},
    create: { Action: 'update', Subject: 'Supplier' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'delete', Subject: 'Supplier' } },
    update: {},
    create: { Action: 'delete', Subject: 'Supplier' },
  });

  // Inventory Permissions (Giai đoạn 8)
  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'Inventory' } },
    update: {},
    create: { Action: 'read', Subject: 'Inventory' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'create', Subject: 'Inventory' } },
    update: {},
    create: { Action: 'create', Subject: 'Inventory' }, // Nhập kho
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'update', Subject: 'Inventory' } },
    update: {},
    create: { Action: 'update', Subject: 'Inventory' }, // Điều chỉnh tồn kho
  });

  // Category Permissions
  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'Category' } },
    update: {},
    create: { Action: 'read', Subject: 'Category' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'create', Subject: 'Category' } },
    update: {},
    create: { Action: 'create', Subject: 'Category' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'update', Subject: 'Category' } },
    update: {},
    create: { Action: 'update', Subject: 'Category' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'delete', Subject: 'Category' } },
    update: {},
    create: { Action: 'delete', Subject: 'Category' },
  });

  // Customer Permissions (Giai đoạn 9)
  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'read', Subject: 'Customer' } },
    update: {},
    create: { Action: 'read', Subject: 'Customer' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'create', Subject: 'Customer' } },
    update: {},
    create: { Action: 'create', Subject: 'Customer' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'update', Subject: 'Customer' } },
    update: {},
    create: { Action: 'update', Subject: 'Customer' },
  });

  await prisma.permission.upsert({
    where: { Action_Subject: { Action: 'delete', Subject: 'Customer' } },
    update: {},
    create: { Action: 'delete', Subject: 'Customer' },
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
              connect: {
                Action_Subject: { Action: 'update', Subject: 'Product' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'delete', Subject: 'Product' },
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
          // Supplier permissions (Giai đoạn 8)
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'read', Subject: 'Supplier' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'create', Subject: 'Supplier' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'update', Subject: 'Supplier' },
              },
            },
          },
          // Inventory permissions (Giai đoạn 8)
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'read', Subject: 'Inventory' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'create', Subject: 'Inventory' },
              },
            },
          },
          // Category permissions
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'read', Subject: 'Category' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'create', Subject: 'Category' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'update', Subject: 'Category' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'delete', Subject: 'Category' },
              },
            },
          },
          // Customer permissions (Giai đoạn 9)
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'read', Subject: 'Customer' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'create', Subject: 'Customer' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'update', Subject: 'Customer' },
              },
            },
          },
          {
            permission: {
              connect: {
                Action_Subject: { Action: 'delete', Subject: 'Customer' },
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
