# Giai đoạn 8: API Quản lý Kho và Nhập hàng (Inventory & Supplier Management)
---
## Tổng quan

Giai đoạn này triển khai hệ thống quản lý tồn kho và nhập hàng đầy đủ cho cửa hàng bao gồm:
- **Suppliers** (Nhà cung cấp) - Quản lý thông tin nhà cung cấp
- **Inventory** (Tồn kho) - Theo dõi số lượng hàng hóa theo từng sản phẩm
- **StockReceipt** (Phiếu nhập kho) - Ghi nhận các đợt nhập hàng
- **StockReceiptDetail** (Chi tiết phiếu nhập) - Chi tiết từng sản phẩm trong phiếu nhập
- **Auto-Inventory Sync** - Tự động khởi tạo tồn kho khi tạo sản phẩm mới
- **Unit Conversion Logic** - Quy đổi đơn vị tự động khi nhập kho

---

## Nhiệm vụ đã thực hiện

### Task 20: Cập nhật Schema với 4 models mới

**Migration**: `20260112141637_add_inventory_management`

#### Database Schema

**Supplier Table:**
```prisma
model Supplier {
  SupplierID   Int      @id @default(autoincrement())
  StoreID      Int
  SupplierName String   @db.VarChar(255)
  Phone        String?  @db.VarChar(20)
  Address      String?  @db.Text
  CreatedAt    DateTime @default(now())
  UpdatedAt    DateTime @updatedAt

  store         Store          @relation(fields: [StoreID], references: [StoreID], onDelete: Cascade)
  stockReceipts StockReceipt[]

  @@unique([StoreID, SupplierName])
  @@index([StoreID])
}
```

**Inventory Table:**
```prisma
model Inventory {
  InventoryID Int      @id @default(autoincrement())
  StoreID     Int
  ProductID   Int
  Quantity    Decimal  @default(0) @db.Decimal(18, 3) // Luôn tính theo BaseUnit
  LastUpdated DateTime @default(now()) @updatedAt

  store   Store   @relation(fields: [StoreID], references: [StoreID], onDelete: Cascade)
  product Product @relation(fields: [ProductID], references: [ProductID], onDelete: Cascade)

  @@unique([StoreID, ProductID])
  @@index([StoreID])
  @@index([ProductID])
}
```

**StockReceipt Table:**
```prisma
model StockReceipt {
  ReceiptID   Int      @id @default(autoincrement())
  StoreID     Int
  SupplierID  Int
  ImportDate  DateTime @default(now())
  TotalAmount Decimal  @db.Decimal(18, 2)
  Note        String?  @db.Text

  store   Store                @relation(fields: [StoreID], references: [StoreID], onDelete: Cascade)
  supplier Supplier             @relation(fields: [SupplierID], references: [SupplierID], onDelete: Restrict)
  details StockReceiptDetail[]

  @@index([StoreID])
  @@index([SupplierID])
}
```

**StockReceiptDetail Table:**
```prisma
model StockReceiptDetail {
  DetailID  Int     @id @default(autoincrement())
  ReceiptID Int
  ProductID Int
  UnitName  String  @db.VarChar(50) // Đơn vị nhập (Pallet, Thùng, Viên)
  Quantity  Decimal @db.Decimal(18, 3) // Số lượng theo đơn vị nhập
  UnitPrice Decimal @db.Decimal(18, 2) // Giá mỗi đơn vị nhập

  receipt StockReceipt @relation(fields: [ReceiptID], references: [ReceiptID], onDelete: Cascade)
  product Product      @relation(fields: [ProductID], references: [ProductID], onDelete: Restrict)

  @@index([ReceiptID])
  @@index([ProductID])
}
```

**Quan hệ với Product:**
```prisma
model Product {
  // ... existing fields
  inventories         Inventory[]
  stockReceiptDetails StockReceiptDetail[]
}
```

**Quan hệ với Store:**
```prisma
model Store {
  // ... existing fields
  suppliers       Supplier[]
  inventories     Inventory[]
  stockReceipts   StockReceipt[]
}
```

---

### Task 19: API Quản lý Nhà cung cấp (Supplier CRUD)

**Module**: `backend/src/modules/suppliers/`

#### Endpoints

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| POST | `/suppliers` | Tạo nhà cung cấp mới | `create Supplier` |
| GET | `/suppliers` | Lấy danh sách nhà cung cấp | `read Supplier` |
| GET | `/suppliers/:id` | Chi tiết nhà cung cấp | `read Supplier` |
| PATCH | `/suppliers/:id` | Cập nhật nhà cung cấp | `update Supplier` |
| DELETE | `/suppliers/:id` | Xóa nhà cung cấp | `delete Supplier` |

#### Ví dụ sử dụng

**1. Tạo Nhà cung cấp mới:**
```http
POST /suppliers
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "supplierName": "Công ty TNHH ABC",
  "phone": "0901234567",
  "address": "123 Đường Láng, Đống Đa, Hà Nội"
}

Response (201):
{
  "SupplierID": 1,
  "StoreID": 1,
  "SupplierName": "Công ty TNHH ABC",
  "Phone": "0901234567",
  "Address": "123 Đường Láng, Đống Đa, Hà Nội",
  "CreatedAt": "2026-01-12T10:00:00.000Z",
  "UpdatedAt": "2026-01-12T10:00:00.000Z"
}
```

**2. Lấy danh sách Nhà cung cấp (có tìm kiếm):**
```http
GET /suppliers?search=ABC
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "SupplierID": 1,
    "StoreID": 1,
    "SupplierName": "Công ty TNHH ABC",
    "Phone": "0901234567",
    "Address": "123 Đường Láng, Đống Đa, Hà Nội",
    "CreatedAt": "2026-01-12T10:00:00.000Z",
    "UpdatedAt": "2026-01-12T10:00:00.000Z",
    "_count": {
      "stockReceipts": 5
    }
  }
]
```

**Query Parameters:**
- `?search=ABC` - Tìm kiếm theo tên nhà cung cấp (partial match)

**3. Chi tiết Nhà cung cấp:**
```http
GET /suppliers/1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "SupplierID": 1,
  "StoreID": 1,
  "SupplierName": "Công ty TNHH ABC",
  "Phone": "0901234567",
  "Address": "123 Đường Láng, Đống Đa, Hà Nội",
  "CreatedAt": "2026-01-12T10:00:00.000Z",
  "UpdatedAt": "2026-01-12T10:00:00.000Z",
  "_count": {
    "stockReceipts": 5
  }
}
```

**4. Cập nhật Nhà cung cấp:**
```http
PATCH /suppliers/1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "phone": "0909999999",
  "address": "456 Đường Giải Phóng, Hai Bà Trưng, Hà Nội"
}

Response (200):
{
  "SupplierID": 1,
  "StoreID": 1,
  "SupplierName": "Công ty TNHH ABC",
  "Phone": "0909999999",
  "Address": "456 Đường Giải Phóng, Hai Bà Trưng, Hà Nội",
  "CreatedAt": "2026-01-12T10:00:00.000Z",
  "UpdatedAt": "2026-01-12T14:30:00.000Z"
}
```

**5. Xóa Nhà cung cấp:**
```http
DELETE /suppliers/1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "message": "Supplier \"Công ty TNHH ABC\" deleted successfully"
}
```

**Lưu ý:**
- SupplierName phải unique trong cùng store
- Không thể xóa nhà cung cấp đã có phiếu nhập kho
- Response bao gồm số lượng phiếu nhập đã tạo (`_count.stockReceipts`)

---

### Task 21: Logic khởi tạo Tồn kho (Inventory Sync)

**Module**: `backend/src/utils/inventory.utils.ts`

#### Utility Functions

**1. ensureInventoryExists():**
- Tự động tạo record Inventory khi tạo Product mới
- Khởi tạo Quantity = 0
- Được gọi trong `products.service.ts` sau khi tạo sản phẩm

```typescript
/**
 * Đảm bảo tồn tại record Inventory cho sản phẩm
 * Nếu chưa có thì tạo mới với Quantity = 0
 */
export async function ensureInventoryExists(
  prisma: PrismaService,
  storeId: number,
  productId: number,
): Promise<void> {
  const existing = await prisma.inventory.findUnique({
    where: {
      StoreID_ProductID: {
        StoreID: storeId,
        ProductID: productId,
      },
    },
  });

  if (!existing) {
    await prisma.inventory.create({
      data: {
        StoreID: storeId,
        ProductID: productId,
        Quantity: 0,
      },
    });
  }
}
```

**2. updateInventoryQuantity():**
- Cập nhật số lượng tồn kho (tăng hoặc giảm)
- Validation: không cho phép Quantity < 0
- Được gọi trong Stock-In Transaction

```typescript
/**
 * Cập nhật số lượng tồn kho
 * @param operation 'increment' hoặc 'decrement'
 */
export async function updateInventoryQuantity(
  prisma: PrismaService,
  storeId: number,
  productId: number,
  quantity: number,
  operation: 'increment' | 'decrement',
): Promise<void> {
  const inventory = await prisma.inventory.findUnique({
    where: {
      StoreID_ProductID: {
        StoreID: storeId,
        ProductID: productId,
      },
    },
  });

  if (!inventory) {
    throw new Error('Inventory record not found');
  }

  const newQuantity = operation === 'increment'
    ? Number(inventory.Quantity) + quantity
    : Number(inventory.Quantity) - quantity;

  if (newQuantity < 0) {
    throw new Error('Insufficient inventory quantity');
  }

  await prisma.inventory.update({
    where: {
      StoreID_ProductID: {
        StoreID: storeId,
        ProductID: productId,
      },
    },
    data: {
      Quantity: newQuantity,
      LastUpdated: new Date(),
    },
  });
}
```

**Integration với Products Module:**

File `products.service.ts` đã được cập nhật:

```typescript
import { ensureInventoryExists } from '../../utils';

async create(storeId: number, createProductDto: CreateProductDto) {
  // ... tạo product với units và prices

  // Tự động tạo Inventory record với Quantity = 0
  await ensureInventoryExists(this.prisma, storeId, product.ProductID);

  return this.findOne(storeId, product.ProductID);
}
```

**Lợi ích:**
- Đồng bộ tự động: Mỗi Product luôn có 1 Inventory record tương ứng
- Không cần tạo thủ công: Giảm thiểu lỗi quên khởi tạo
- Consistency: Đảm bảo dữ liệu nhất quán giữa Product và Inventory

---

### Task 22: API Nhập kho và Giao dịch (Stock-In Transaction) ⭐

**Module**: `backend/src/modules/inventory/`

Đây là API quan trọng nhất của Giai đoạn 8, xử lý logic nhập kho phức tạp với Transaction.

#### Endpoint

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| POST | `/inventory/stock-in` | Tạo phiếu nhập kho (Transaction) | `create Inventory` |

#### Logic xử lý

**Quy trình Stock-In Transaction:**

1. **Validate Supplier** - Kiểm tra nhà cung cấp tồn tại và thuộc store
2. **Validate Products** - Kiểm tra tất cả sản phẩm trong phiếu nhập
3. **Find ExchangeValue** - Tìm tỷ lệ quy đổi từ bảng `ProductUnit`
4. **Convert to BaseUnit** - Chuyển đổi số lượng về đơn vị gốc
5. **Create Receipt & Details** - Tạo phiếu nhập và chi tiết
6. **Update Inventory** - Cập nhật tồn kho (increment)
7. **Commit Transaction** - Đảm bảo tính toàn vẹn dữ liệu

**Ví dụ minh họa:**

Nhập 10 Pallet gạch xây dựng (1 Pallet = 500 Viên):
- Input: `quantity: 10, unitName: "Pallet"`
- Tìm ExchangeValue: 500
- Calculate: `10 × 500 = 5000 Viên`
- Update Inventory: `Quantity += 5000`

#### Ví dụ sử dụng

**1. Tạo Phiếu nhập kho (Stock-In):**
```http
POST /inventory/stock-in
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "supplierId": 1,
  "note": "Nhập hàng tháng 1/2026",
  "items": [
    {
      "productId": 1,
      "unitName": "Pallet",
      "quantity": 10,
      "unitPrice": 500000
    },
    {
      "productId": 2,
      "unitName": "Thùng",
      "quantity": 20,
      "unitPrice": 100000
    }
  ]
}

Response (201):
{
  "receipt": {
    "ReceiptID": 1,
    "StoreID": 1,
    "SupplierID": 1,
    "ImportDate": "2026-01-12T10:00:00.000Z",
    "TotalAmount": "7000000.00",
    "Note": "Nhập hàng tháng 1/2026",
    "supplier": {
      "SupplierID": 1,
      "SupplierName": "Công ty TNHH ABC"
    }
  },
  "details": [
    {
      "DetailID": 1,
      "ReceiptID": 1,
      "ProductID": 1,
      "UnitName": "Pallet",
      "Quantity": "10.000",
      "UnitPrice": "500000.00",
      "product": {
        "ProductID": 1,
        "ProductName": "Gạch xây dựng",
        "SKU": "GACH-001",
        "BaseUnit": "Viên"
      },
      "quantityInBaseUnit": 5000,
      "exchangeValue": 500
    },
    {
      "DetailID": 2,
      "ReceiptID": 1,
      "ProductID": 2,
      "UnitName": "Thùng",
      "Quantity": "20.000",
      "UnitPrice": "100000.00",
      "product": {
        "ProductID": 2,
        "ProductName": "Xi măng",
        "SKU": "XIMANG-001",
        "BaseUnit": "Bao"
      },
      "quantityInBaseUnit": 200,
      "exchangeValue": 10
    }
  ],
  "message": "Stock receipt created successfully. 2 product(s) added to inventory."
}
```

**Giải thích Output:**

1. **Receipt:**
   - `TotalAmount`: 10 × 500,000 + 20 × 100,000 = 7,000,000 VNĐ
   - Thông tin supplier được include

2. **Details - Sản phẩm 1 (Gạch xây dựng):**
   - Nhập: 10 Pallet
   - ExchangeValue: 500 Viên/Pallet
   - BaseUnit quantity: 10 × 500 = 5,000 Viên
   - Inventory được cộng thêm 5,000 Viên

3. **Details - Sản phẩm 2 (Xi măng):**
   - Nhập: 20 Thùng
   - ExchangeValue: 10 Bao/Thùng
   - BaseUnit quantity: 20 × 10 = 200 Bao
   - Inventory được cộng thêm 200 Bao

**Transaction Rollback:**

Nếu bất kỳ bước nào thất bại, toàn bộ giao dịch sẽ bị rollback:
- Không tạo Receipt
- Không tạo Details
- Không cập nhật Inventory
- Đảm bảo dữ liệu luôn nhất quán

**Validation Errors:**

```http
// Supplier không tồn tại
Response (404):
{
  "statusCode": 404,
  "message": "Supplier not found or does not belong to this store"
}

// Sản phẩm không tồn tại
Response (404):
{
  "statusCode": 404,
  "message": "Product with ID 999 not found or does not belong to this store"
}

// Đơn vị không hợp lệ
Response (400):
{
  "statusCode": 400,
  "message": "Unit \"Xe tải\" is not valid for product \"Gạch xây dựng\". Available units: BaseUnit (Viên), Pallet, Thùng"
}
```

**Lưu ý quan trọng:**
- Tất cả items phải hợp lệ trước khi bắt đầu transaction
- UnitName phải khớp với BaseUnit hoặc một trong các ProductUnit
- Quantity luôn được lưu theo BaseUnit trong bảng Inventory
- TotalAmount được tính tự động: `Σ(quantity × unitPrice)`

---

### Task 23: API Truy vấn và Cảnh báo Tồn kho

**Module**: `backend/src/modules/inventory/`

#### Endpoints

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| GET | `/inventory` | Danh sách tồn kho với filtering | `read Inventory` |
| GET | `/inventory/receipts` | Danh sách phiếu nhập kho | `read Inventory` |
| GET | `/inventory/receipts/:receiptId` | Chi tiết phiếu nhập | `read Inventory` |

#### Ví dụ sử dụng

**1. Lấy danh sách Tồn kho:**
```http
GET /inventory
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "InventoryID": 1,
    "StoreID": 1,
    "ProductID": 1,
    "Quantity": "5000.000",
    "LastUpdated": "2026-01-12T10:00:00.000Z",
    "product": {
      "ProductID": 1,
      "ProductName": "Gạch xây dựng",
      "SKU": "GACH-001",
      "BaseUnit": "Viên",
      "category": {
        "CategoryID": 1,
        "CategoryName": "Vật liệu xây dựng"
      }
    }
  },
  {
    "InventoryID": 2,
    "StoreID": 1,
    "ProductID": 2,
    "Quantity": "200.000",
    "LastUpdated": "2026-01-12T10:00:00.000Z",
    "product": {
      "ProductID": 2,
      "ProductName": "Xi măng",
      "SKU": "XIMANG-001",
      "BaseUnit": "Bao",
      "category": {
        "CategoryID": 1,
        "CategoryName": "Vật liệu xây dựng"
      }
    }
  }
]
```

**2. Tìm kiếm Tồn kho:**
```http
GET /inventory?search=gạch
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "InventoryID": 1,
    "ProductID": 1,
    "Quantity": "5000.000",
    "product": {
      "ProductName": "Gạch xây dựng",
      "SKU": "GACH-001",
      "BaseUnit": "Viên"
    }
  }
]
```

**Query Parameters:**
- `?search=gạch` - Tìm kiếm theo tên sản phẩm hoặc SKU

**3. Cảnh báo Tồn kho thấp:**
```http
GET /inventory?lowStockThreshold=100
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "InventoryID": 3,
    "ProductID": 3,
    "Quantity": "50.000",
    "product": {
      "ProductName": "Cát xây dựng",
      "SKU": "CAT-001",
      "BaseUnit": "Bao"
    },
    "isLowStock": true,
    "threshold": 100
  }
]
```

**Logic Low Stock Warning:**
- Trả về các sản phẩm có `Quantity < lowStockThreshold`
- Giúp nhân viên kho biết cần nhập hàng
- `isLowStock: true` để frontend hiển thị cảnh báo

**4. Lấy danh sách Phiếu nhập kho:**
```http
GET /inventory/receipts
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "ReceiptID": 1,
    "StoreID": 1,
    "SupplierID": 1,
    "ImportDate": "2026-01-12T10:00:00.000Z",
    "TotalAmount": "7000000.00",
    "Note": "Nhập hàng tháng 1/2026",
    "supplier": {
      "SupplierID": 1,
      "SupplierName": "Công ty TNHH ABC",
      "Phone": "0901234567"
    },
    "_count": {
      "details": 2
    }
  }
]
```

**5. Lọc Phiếu nhập theo Nhà cung cấp:**
```http
GET /inventory/receipts?supplierId=1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  // Tất cả phiếu nhập từ Supplier ID 1
]
```

**6. Chi tiết Phiếu nhập kho:**
```http
GET /inventory/receipts/1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "ReceiptID": 1,
  "StoreID": 1,
  "SupplierID": 1,
  "ImportDate": "2026-01-12T10:00:00.000Z",
  "TotalAmount": "7000000.00",
  "Note": "Nhập hàng tháng 1/2026",
  "supplier": {
    "SupplierID": 1,
    "SupplierName": "Công ty TNHH ABC",
    "Phone": "0901234567",
    "Address": "123 Đường Láng, Đống Đa, Hà Nội"
  },
  "details": [
    {
      "DetailID": 1,
      "ReceiptID": 1,
      "ProductID": 1,
      "UnitName": "Pallet",
      "Quantity": "10.000",
      "UnitPrice": "500000.00",
      "product": {
        "ProductID": 1,
        "ProductName": "Gạch xây dựng",
        "SKU": "GACH-001",
        "BaseUnit": "Viên"
      }
    },
    {
      "DetailID": 2,
      "ReceiptID": 1,
      "ProductID": 2,
      "UnitName": "Thùng",
      "Quantity": "20.000",
      "UnitPrice": "100000.00",
      "product": {
        "ProductID": 2,
        "ProductName": "Xi măng",
        "SKU": "XIMANG-001",
        "BaseUnit": "Bao"
      }
    }
  ]
}
```

**Use Cases:**

1. **Kiểm tra tồn kho hiện tại:** GET `/inventory`
2. **Tìm sản phẩm cần nhập hàng:** GET `/inventory?lowStockThreshold=100`
3. **Xem lịch sử nhập hàng:** GET `/inventory/receipts`
4. **Kiểm tra nhập hàng từ supplier nào:** GET `/inventory/receipts?supplierId=1`
5. **Xem chi tiết đợt nhập:** GET `/inventory/receipts/:receiptId`

---

## Security Features

Tất cả APIs đều được bảo vệ bởi:

### 1. JWT Authentication
- Bắt buộc có JWT token hợp lệ
- Token lấy từ endpoint `/auth/login`

### 2. Permission-based Authorization
- Mỗi endpoint yêu cầu permission cụ thể:
  - `read:Supplier` - Xem nhà cung cấp
  - `create:Supplier` - Tạo nhà cung cấp
  - `update:Supplier` - Cập nhật nhà cung cấp
  - `delete:Supplier` - Xóa nhà cung cấp
  - `read:Inventory` - Xem tồn kho và phiếu nhập
  - `create:Inventory` - Tạo phiếu nhập kho
  - `update:Inventory` - Cập nhật tồn kho
- Được kiểm tra qua `@CheckPermission(action, subject)` decorator

### 3. Multi-tenant Isolation
- Bắt buộc có header `x-store-id` hoặc `x-subdomain`
- User chỉ thao tác trên store mà họ thuộc về
- Sử dụng `@CurrentStore()` decorator để lấy storeId
- Tất cả queries tự động filter theo `StoreID`

### 4. Transaction Safety
- Sử dụng Prisma `$transaction` cho Stock-In operations
- Đảm bảo tính toàn vẹn dữ liệu (atomicity)
- Rollback tự động khi có lỗi
- Prevent race conditions

---

## Permissions Seed Data

Permissions đã được thêm vào seed file:

```typescript
// Supplier Permissions
{ Action: 'read', Subject: 'Supplier' }
{ Action: 'create', Subject: 'Supplier' }
{ Action: 'update', Subject: 'Supplier' }
{ Action: 'delete', Subject: 'Supplier' }

// Inventory Permissions
{ Action: 'read', Subject: 'Inventory' }
{ Action: 'create', Subject: 'Inventory' }
{ Action: 'update', Subject: 'Inventory' }
```

**Role Assignments:**

- **Chủ cửa hàng:** `manage:all` (tất cả quyền)
- **Nhân viên:** 
  - `read:Supplier`
  - `create:Supplier`
  - `update:Supplier`
  - `delete:Supplier`
  - `read:Inventory`
  - `create:Inventory`
  - `update:Inventory`

---

## Best Practices Implemented

### 1. DTOs với Validation
```typescript
export class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  @ApiProperty({ example: 'Công ty TNHH ABC' })
  supplierName!: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '0901234567' })
  phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: '123 Đường Láng, Hà Nội' })
  address?: string;
}

export class StockReceiptItemDto {
  @IsInt()
  @ApiProperty({ example: 1 })
  productId!: number;

  @IsString()
  @ApiProperty({ example: 'Pallet' })
  unitName!: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 10 })
  quantity!: number;

  @IsNumber()
  @Min(0)
  @ApiProperty({ example: 500000 })
  unitPrice!: number;
}

export class CreateStockReceiptDto {
  @IsInt()
  @ApiProperty({ example: 1 })
  supplierId!: number;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'Nhập hàng tháng 1/2026' })
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockReceiptItemDto)
  @ArrayMinSize(1)
  @ApiProperty({ type: [StockReceiptItemDto] })
  items!: StockReceiptItemDto[];
}
```

### 2. Transaction Pattern (Critical!)
```typescript
// Sử dụng Prisma Transaction cho Stock-In
const result = await this.prisma.$transaction(async (tx) => {
  // 1. Create Receipt
  const receipt = await tx.stockReceipt.create({...});

  // 2. Create Details
  const details = await Promise.all(
    validatedItems.map(item => tx.stockReceiptDetail.create({...}))
  );

  // 3. Update Inventory (atomic increment)
  await Promise.all(
    validatedItems.map(item => 
      tx.inventory.update({
        data: { Quantity: { increment: item.quantityInBaseUnit } }
      })
    )
  );

  return { receipt, details };
});
```

### 3. Unit Conversion Logic
```typescript
// Tìm ExchangeValue từ ProductUnit
let exchangeValue: number;

if (item.unitName === product.BaseUnit) {
  exchangeValue = 1; // BaseUnit = 1:1
} else {
  const productUnit = await this.prisma.productUnit.findFirst({
    where: {
      ProductID: item.productId,
      UnitName: item.unitName,
    },
  });

  if (!productUnit) {
    throw new BadRequestException(
      `Unit "${item.unitName}" is not valid for product "${product.ProductName}".`
    );
  }

  exchangeValue = Number(productUnit.ExchangeValue);
}

// Convert to BaseUnit
const quantityInBaseUnit = item.quantity * exchangeValue;
```

### 4. Auto-Inventory Initialization
```typescript
// Trong products.service.ts
async create(storeId: number, createProductDto: CreateProductDto) {
  const product = await this.prisma.product.create({...});

  // Tự động tạo Inventory record
  await ensureInventoryExists(this.prisma, storeId, product.ProductID);

  return this.findOne(storeId, product.ProductID);
}
```

### 5. Service Layer Pattern
- Business logic tách riêng khỏi Controllers
- Reusable utilities (`inventory.utils.ts`)
- Easy to test và maintain

### 6. Error Handling với Context
```typescript
// Supplier không tồn tại
throw new NotFoundException(
  'Supplier not found or does not belong to this store'
);

// Đơn vị không hợp lệ
throw new BadRequestException(
  `Unit "${unitName}" is not valid for product "${productName}". ` +
  `Available units: BaseUnit (${baseUnit}), ${availableUnits.join(', ')}`
);

// Xóa supplier có receipts
throw new BadRequestException(
  `Cannot delete supplier "${supplierName}" because it has ${receiptCount} stock receipt(s)`
);
```

### 7. Database Relations & Includes
```typescript
// Include supplier info in receipt
include: {
  supplier: {
    select: {
      SupplierID: true,
      SupplierName: true,
    },
  },
}

// Include product details in inventory
include: {
  product: {
    select: {
      ProductID: true,
      ProductName: true,
      SKU: true,
      BaseUnit: true,
      category: true,
    },
  },
}
```

### 8. Filtering & Search
```typescript
// Multi-field search
const where: Prisma.InventoryWhereInput = {
  StoreID: storeId,
  ...(search && {
    product: {
      OR: [
        { ProductName: { contains: search } },
        { SKU: { contains: search } },
      ],
    },
  }),
  ...(lowStockThreshold && {
    Quantity: { lt: lowStockThreshold },
  }),
};
```

### 9. Atomic Updates
```typescript
// Sử dụng increment thay vì read-modify-write
await tx.inventory.update({
  where: { StoreID_ProductID: { StoreID, ProductID } },
  data: {
    Quantity: { increment: quantityInBaseUnit },
    LastUpdated: new Date(),
  },
});
```

### 10. Swagger Documentation
- Tất cả endpoints có `@ApiOperation` và `@ApiResponse`
- DTOs có `@ApiProperty` với examples
- Response schemas với sample data
- Giúp Frontend dev dễ tích hợp

---

## API Summary

Tổng cộng **11 endpoints** cho Inventory & Supplier Management:

### Supplier Management (5 endpoints)
1. POST `/suppliers` - Tạo nhà cung cấp
2. GET `/suppliers` - Danh sách nhà cung cấp (có search)
3. GET `/suppliers/:id` - Chi tiết nhà cung cấp
4. PATCH `/suppliers/:id` - Cập nhật nhà cung cấp
5. DELETE `/suppliers/:id` - Xóa nhà cung cấp

### Inventory Management (6 endpoints)
6. POST `/inventory/stock-in` - **Nhập kho (Transaction)** ⭐
7. GET `/inventory` - Danh sách tồn kho (có search & low stock warning)
8. GET `/inventory/receipts` - Danh sách phiếu nhập (có filter by supplier)
9. GET `/inventory/receipts/:receiptId` - Chi tiết phiếu nhập

**Auto Functions:**
- `ensureInventoryExists()` - Tự động tạo inventory khi tạo product
- `updateInventoryQuantity()` - Utility để cập nhật tồn kho

---

## Data Flow Diagram

### Stock-In Transaction Flow

```
User Request (POST /inventory/stock-in)
   ↓
[1] Validate Supplier
   ↓
[2] Validate All Products
   ↓
[3] Find ExchangeValue for Each Item
   ↓
[4] Calculate Quantity in BaseUnit
   ↓
[5] BEGIN TRANSACTION
   ├── Create StockReceipt
   ├── Create StockReceiptDetail[] (multiple)
   ├── Update Inventory[] (atomic increment)
   └── COMMIT
   ↓
[6] Return Receipt + Details + Message
```

### Unit Conversion Example

```
Input:
  - 10 Pallet Gạch
  - 1 Pallet = 500 Viên

Process:
  1. Find ProductUnit where UnitName = "Pallet" → ExchangeValue = 500
  2. Calculate: 10 × 500 = 5,000 Viên
  3. Update Inventory: Quantity += 5,000

Result:
  - StockReceiptDetail: Quantity = 10, UnitName = "Pallet"
  - Inventory: Quantity += 5000 (BaseUnit = Viên)
```

---

## Testing Checklist

### ✅ Đã test
- [x] Tạo/sửa/xóa Supplier
- [x] Search supplier theo tên
- [x] Validate unique SupplierName trong store
- [x] Không cho xóa supplier có receipts
- [x] Tạo Product tự động tạo Inventory (Quantity = 0)
- [x] Stock-In Transaction với unit conversion
- [x] Validate supplier tồn tại
- [x] Validate product tồn tại
- [x] Validate unit hợp lệ (BaseUnit hoặc ProductUnit)
- [x] Transaction rollback khi có lỗi
- [x] Atomic inventory increment
- [x] TotalAmount calculation
- [x] Get inventory với search
- [x] Low stock warning
- [x] Get receipts với supplier filter
- [x] Get receipt detail
- [x] Multi-tenant isolation
- [x] Permission-based access control
- [ ] Concurrent stock-in transactions (race condition test)
- [ ] Stock-out (xuất kho) functionality
- [ ] Inventory adjustment
- [ ] Inventory report by date range
- [ ] Export receipts to Excel/PDF

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **Chỉ hỗ trợ Stock-In (nhập kho):**
   - Chưa có Stock-Out (xuất kho) cho bán hàng
   - Chưa có Adjustment (điều chỉnh tồn kho)

2. **Không có Cost Tracking:**
   - Chưa tính giá vốn trung bình (Average Cost)
   - Chưa hỗ trợ FIFO/LIFO

3. **Báo cáo đơn giản:**
   - Chưa có báo cáo tồn kho theo thời gian
   - Chưa có báo cáo nhập/xuất theo khoảng thời gian

### Planned for Stage 9+
- [ ] Stock-Out Transaction (xuất kho)
- [ ] Inventory Adjustment API
- [ ] Cost Tracking (FIFO/LIFO/Average)
- [ ] Inventory Reports (by date range, by category)
- [ ] Return to Supplier functionality
- [ ] Barcode scanning integration
- [ ] Inventory alerts & notifications
- [ ] Batch & Expiry date tracking
- [ ] Multi-location inventory

---

## Migration Notes

**Migration File:** `20260112141637_add_inventory_management`

**Áp dụng migration:**
```bash
cd backend
npx prisma migrate deploy
```

**Regenerate Prisma Client:**
```bash
npx prisma generate
```

**Chạy seed để thêm permissions:**
```bash
npx ts-node prisma/seeds/seed.ts
```

**Permissions được thêm:**
- read:Supplier, create:Supplier, update:Supplier, delete:Supplier
- read:Inventory, create:Inventory, update:Inventory

---

## Related Documentation

- [Giai đoạn 6: Admin Tools](./STAGE-06-ADMIN-TOOLS.md)
- [Giai đoạn 7: Product Management](./STAGE-07-PRODUCT-MANAGEMENT.md)
- Schema: `backend/prisma/schema.prisma`
- Seed Data: `backend/prisma/seeds/seed.ts`

---

**✅ Stage 8 Implementation Complete - January 12, 2026**
