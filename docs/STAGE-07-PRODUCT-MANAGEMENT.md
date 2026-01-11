# Giai đoạn 7: API Quản lý Sản phẩm (Product Management)
---
## Tổng quan

Giai đoạn này triển khai hệ thống quản lý sản phẩm đầy đủ cho cửa hàng bao gồm:
- **Products** (Sản phẩm) với nhiều đơn vị quy đổi
- **Categories** (Danh mục sản phẩm)
- **ProductUnits** (Đơn vị quy đổi: Pallet, Thùng, Viên...)
- **PriceList** (Bảng giá đa mục tiêu: Giá lẻ, Giá thợ, Giá đại lý...)

---

## Nhiệm vụ đã thực hiện

### Task 14 & 15: Thiết lập Business Tables và Product CRUD API

**Module**: `backend/src/modules/products/`

#### Database Schema

**Category Table:**
```prisma
model Category {
  CategoryID   Int      @id @default(autoincrement())
  StoreID      Int
  CategoryName String   @db.VarChar(255)
  Description  String?  @db.Text
  CreatedAt    DateTime @default(now())
  UpdatedAt    DateTime @updatedAt
  
  store        Store     @relation(fields: [StoreID], references: [StoreID], onDelete: Cascade)
  products     Product[]
  
  @@unique([StoreID, CategoryName])
}
```

**Product Table:**
```prisma
model Product {
  ProductID   Int      @id @default(autoincrement())
  StoreID     Int
  CategoryID  Int
  ProductName String   @db.VarChar(255)
  SKU         String?  @db.VarChar(50) 
  BaseUnit    String   @db.VarChar(50) // Đơn vị gốc (ví dụ: Viên, Kg, Bao)
  Description String?  @db.Text
  IsActive    Boolean  @default(true)
  CreatedAt   DateTime @default(now())
  UpdatedAt   DateTime @updatedAt

  store        Store         @relation(fields: [StoreID], references: [StoreID], onDelete: Cascade)
  category     Category      @relation(fields: [CategoryID], references: [CategoryID], onDelete: Restrict)
  units        ProductUnit[]
  prices       PriceList[]

  @@unique([StoreID, SKU])
}
```

**ProductUnit Table:**
```prisma
model ProductUnit {
  UnitID        Int     @id @default(autoincrement())
  ProductID     Int
  UnitName      String  @db.VarChar(50) // Ví dụ: Pallet, Xe, Thùng
  ExchangeValue Decimal @db.Decimal(18, 3) // Tỷ lệ quy đổi
  IsDefault     Boolean @default(false)

  product       Product @relation(fields: [ProductID], references: [ProductID], onDelete: Cascade)
}
```

**PriceList Table:**
```prisma
model PriceList {
  PriceID      Int     @id @default(autoincrement())
  ProductID    Int
  PriceName    String  @db.VarChar(100) // Ví dụ: Giá thợ, Giá bán lẻ
  UnitPrice    Decimal @db.Decimal(18, 2)
  MinQuantity  Int     @default(0)

  product      Product @relation(fields: [ProductID], references: [ProductID], onDelete: Cascade)
}
```

---

### API Quản lý Product

#### Endpoints

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| POST | `/products` | Tạo sản phẩm mới | `create Product` |
| GET | `/products` | Lấy danh sách sản phẩm (có filtering) | `read Product` |
| GET | `/products/:id` | Chi tiết sản phẩm | `read Product` |
| PATCH | `/products/:id` | Cập nhật sản phẩm | `update Product` |
| DELETE | `/products/:id` | Xóa mềm sản phẩm | `delete Product` |
| DELETE | `/products/:id/hard` | Xóa vĩnh viễn sản phẩm | `delete Product` |
| POST | `/products/:id/calculate` | Tính số lượng theo đơn vị gốc | `read Product` |

#### Ví dụ sử dụng

**1. Tạo Sản phẩm mới với Units và Prices:**
```http
POST /products
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "productName": "Gạch xây dựng",
  "categoryId": 1,
  "sku": "GACH-001",
  "baseUnit": "Viên",
  "description": "Gạch chất lượng cao",
  "isActive": true,
  "units": [
    {
      "unitName": "Pallet",
      "exchangeValue": 500,
      "isDefault": false
    },
    {
      "unitName": "Thùng",
      "exchangeValue": 50,
      "isDefault": true
    }
  ],
  "prices": [
    {
      "priceName": "Giá lẻ",
      "unitPrice": 1000,
      "minQuantity": 0
    },
    {
      "priceName": "Giá thợ thầu",
      "unitPrice": 800,
      "minQuantity": 100
    },
    {
      "priceName": "Giá đại lý",
      "unitPrice": 700,
      "minQuantity": 500
    }
  ]
}

Response (201):
{
  "ProductID": 1,
  "StoreID": 1,
  "CategoryID": 1,
  "ProductName": "Gạch xây dựng",
  "SKU": "GACH-001",
  "BaseUnit": "Viên",
  "Description": "Gạch chất lượng cao",
  "IsActive": true,
  "CreatedAt": "2026-01-12T10:00:00.000Z",
  "UpdatedAt": "2026-01-12T10:00:00.000Z",
  "category": {
    "CategoryID": 1,
    "CategoryName": "Vật liệu xây dựng"
  },
  "units": [
    {
      "UnitID": 1,
      "ProductID": 1,
      "UnitName": "Pallet",
      "ExchangeValue": "500.000",
      "IsDefault": false
    },
    {
      "UnitID": 2,
      "ProductID": 1,
      "UnitName": "Thùng",
      "ExchangeValue": "50.000",
      "IsDefault": true
    }
  ],
  "prices": [
    {
      "PriceID": 1,
      "ProductID": 1,
      "PriceName": "Giá lẻ",
      "UnitPrice": "1000.00",
      "MinQuantity": 0
    },
    {
      "PriceID": 2,
      "ProductID": 1,
      "PriceName": "Giá thợ thầu",
      "UnitPrice": "800.00",
      "MinQuantity": 100
    },
    {
      "PriceID": 3,
      "ProductID": 1,
      "PriceName": "Giá đại lý",
      "UnitPrice": "700.00",
      "MinQuantity": 500
    }
  ]
}
```

**2. Lấy danh sách Sản phẩm (với filtering - Task 18):**
```http
GET /products?search=gạch&categoryId=1&isActive=true
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "ProductID": 1,
    "StoreID": 1,
    "CategoryID": 1,
    "ProductName": "Gạch xây dựng",
    "SKU": "GACH-001",
    "BaseUnit": "Viên",
    "Description": "Gạch chất lượng cao",
    "IsActive": true,
    "CreatedAt": "2026-01-12T10:00:00.000Z",
    "UpdatedAt": "2026-01-12T10:00:00.000Z",
    "category": {
      "CategoryID": 1,
      "CategoryName": "Vật liệu xây dựng"
    },
    "units": [...],
    "prices": [...]
  }
]
```

**Query Parameters cho Filtering:**
- `?search=gạch` - Tìm kiếm theo tên sản phẩm hoặc SKU (partial match)
- `?categoryId=1` - Lọc theo danh mục
- `?isActive=true` - Lọc theo trạng thái hoạt động
- Có thể kết hợp nhiều filters

**3. Chi tiết Sản phẩm:**
```http
GET /products/1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "ProductID": 1,
  "StoreID": 1,
  "CategoryID": 1,
  "ProductName": "Gạch xây dựng",
  "SKU": "GACH-001",
  "BaseUnit": "Viên",
  "Description": "Gạch chất lượng cao",
  "IsActive": true,
  "CreatedAt": "2026-01-12T10:00:00.000Z",
  "UpdatedAt": "2026-01-12T10:00:00.000Z",
  "category": {
    "CategoryID": 1,
    "CategoryName": "Vật liệu xây dựng",
    "Description": "Các loại vật liệu dùng trong xây dựng"
  },
  "units": [
    {
      "UnitID": 1,
      "ProductID": 1,
      "UnitName": "Pallet",
      "ExchangeValue": "500.000",
      "IsDefault": false
    },
    {
      "UnitID": 2,
      "ProductID": 1,
      "UnitName": "Thùng",
      "ExchangeValue": "50.000",
      "IsDefault": true
    }
  ],
  "prices": [
    {
      "PriceID": 1,
      "ProductID": 1,
      "PriceName": "Giá lẻ",
      "UnitPrice": "1000.00",
      "MinQuantity": 0
    },
    {
      "PriceID": 2,
      "ProductID": 1,
      "PriceName": "Giá thợ thầu",
      "UnitPrice": "800.00",
      "MinQuantity": 100
    },
    {
      "PriceID": 3,
      "ProductID": 1,
      "PriceName": "Giá đại lý",
      "UnitPrice": "700.00",
      "MinQuantity": 500
    }
  ]
}
```

**4. Cập nhật Sản phẩm:**
```http
PATCH /products/1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "productName": "Gạch xây dựng cao cấp",
  "description": "Gạch chất lượng xuất khẩu",
  "isActive": true
}

Response (200):
{
  "ProductID": 1,
  "ProductName": "Gạch xây dựng cao cấp",
  "Description": "Gạch chất lượng xuất khẩu",
  "IsActive": true,
  "UpdatedAt": "2026-01-12T11:00:00.000Z",
  ...
}
```

**5. Xóa mềm Sản phẩm (Soft Delete):**
```http
DELETE /products/1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "ProductID": 1,
  "ProductName": "Gạch xây dựng cao cấp",
  "IsActive": false,
  "UpdatedAt": "2026-01-12T12:00:00.000Z"
}
```

**6. Xóa vĩnh viễn Sản phẩm (Hard Delete):**
```http
DELETE /products/1/hard
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "ProductID": 1,
  "ProductName": "Gạch xây dựng cao cấp",
  "SKU": "GACH-001"
}
```

**7. Tính toán số lượng theo đơn vị gốc:**
```http
POST /products/1/calculate
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "unitName": "Pallet",
  "quantity": 10
}

Response (200):
{
  "productId": 1,
  "unit": "Pallet",
  "quantity": 10,
  "baseQuantity": 5000
}
```

**Giải thích:** 10 Pallet × 500 Viên/Pallet = 5000 Viên

**Lưu ý:**
- SKU phải unique trong cùng store
- BaseUnit là đơn vị nhỏ nhất (ví dụ: Viên, Kg, Cái)
- Units chứa các đơn vị lớn hơn với tỷ lệ quy đổi
- Prices có thể có nhiều mức giá cho các nhóm khách hàng khác nhau
- Soft delete: Set IsActive = false, không xóa khỏi DB
- Hard delete: Xóa vĩnh viễn khỏi DB

---

### Task 17: API Quản lý Bảng giá đa mục tiêu (PriceList)

Cho phép thiết lập nhiều mức giá cho một sản phẩm dựa trên số lượng mua.

#### Endpoints

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| POST | `/products/:id/prices` | Thêm bảng giá mới | `create Product` |
| PATCH | `/products/:id/prices/:priceId` | Cập nhật bảng giá | `update Product` |
| DELETE | `/products/:id/prices/:priceId` | Xóa bảng giá | `delete Product` |
| GET | `/products/:id/prices/applicable?quantity=150` | Lấy giá phù hợp theo số lượng | `read Product` |

#### Ví dụ sử dụng

**1. Thêm Bảng giá mới:**
```http
POST /products/1/prices
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "priceName": "Giá VIP",
  "unitPrice": 600,
  "minQuantity": 1000
}

Response (201):
{
  "PriceID": 4,
  "ProductID": 1,
  "PriceName": "Giá VIP",
  "UnitPrice": "600.00",
  "MinQuantity": 1000
}
```

**2. Cập nhật Bảng giá:**
```http
PATCH /products/1/prices/2
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "priceName": "Giá thợ",
  "unitPrice": 850,
  "minQuantity": 100
}

Response (200):
{
  "PriceID": 2,
  "ProductID": 1,
  "PriceName": "Giá thợ",
  "UnitPrice": "850.00",
  "MinQuantity": 100
}
```

**3. Xóa Bảng giá:**
```http
DELETE /products/1/prices/4
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "PriceID": 4,
  "ProductID": 1,
  "PriceName": "Giá VIP",
  "UnitPrice": "600.00",
  "MinQuantity": 1000
}
```

**4. Lấy Giá phù hợp dựa trên số lượng mua:**
```http
GET /products/1/prices/applicable?quantity=150
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "product": {
    "ProductID": 1,
    "ProductName": "Gạch xây dựng",
    "SKU": "GACH-001",
    "BaseUnit": "Viên"
  },
  "quantity": 150,
  "appliedPrice": {
    "PriceID": 2,
    "PriceName": "Giá thợ thầu",
    "UnitPrice": "800.00",
    "MinQuantity": 100
  },
  "totalAmount": 120000,
  "allAvailablePrices": [
    {
      "PriceID": 2,
      "PriceName": "Giá thợ thầu",
      "UnitPrice": "800.00",
      "MinQuantity": 100
    },
    {
      "PriceID": 1,
      "PriceName": "Giá lẻ",
      "UnitPrice": "1000.00",
      "MinQuantity": 0
    }
  ]
}
```

**Logic xử lý số lượng tối thiểu:**

Khi khách hàng mua 150 viên:
1. Hệ thống tìm tất cả bảng giá có `MinQuantity <= 150`:
   - Giá lẻ (MinQuantity: 0) 
   - Giá thợ thầu (MinQuantity: 100) 
   - Giá đại lý (MinQuantity: 500) (không đủ điều kiện)

2. Chọn giá có `MinQuantity` cao nhất:
   - **Giá thợ thầu** (MinQuantity: 100) → 800 VNĐ/viên

3. Tính tổng tiền:
   - 150 viên × 800 VNĐ = **120,000 VNĐ**

**Lưu ý:**
- Một sản phẩm có thể có nhiều bảng giá
- Logic tự động chọn giá tốt nhất cho khách hàng
- MinQuantity = 0 là giá mặc định (giá lẻ)
- API trả về cả `allAvailablePrices` để UI có thể hiển thị thêm

---

### Task 18: Tìm kiếm & Lọc (Filtering)

Giúp nhân viên tìm hàng nhanh tại quầy.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Tìm kiếm theo tên sản phẩm hoặc SKU | `?search=gạch` |
| `categoryId` | number | Lọc theo danh mục | `?categoryId=1` |
| `isActive` | boolean | Lọc theo trạng thái | `?isActive=true` |

#### Ví dụ sử dụng

**1. Tìm kiếm theo tên:**
```http
GET /products?search=gạch
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "ProductID": 1,
    "ProductName": "Gạch xây dựng",
    "SKU": "GACH-001",
    ...
  },
  {
    "ProductID": 5,
    "ProductName": "Gạch ốp lát",
    "SKU": "GACH-005",
    ...
  }
]
```

**2. Lọc theo danh mục:**
```http
GET /products?categoryId=1
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  // Tất cả sản phẩm thuộc danh mục "Vật liệu xây dựng"
]
```

**3. Kết hợp nhiều filters:**
```http
GET /products?search=gạch&categoryId=1&isActive=true
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  // Sản phẩm có tên chứa "gạch", thuộc danh mục 1, đang active
]
```

**Bảo mật Multi-tenant:**
- **Luôn luôn** filter theo `StoreID` từ JWT Token
- Sử dụng `@CurrentStore()` decorator để lấy storeId an toàn
- Không bao giờ trả dữ liệu của store khác
- User không thể truy cập sản phẩm của store mà họ không thuộc về

---

## Security Features

Tất cả APIs đều được bảo vệ bởi:

### 1. JWT Authentication
- Bắt buộc có JWT token hợp lệ
- Token lấy từ endpoint `/auth/login`

### 2. Permission-based Authorization
- Mỗi endpoint yêu cầu permission cụ thể:
  - `read:Product` - Xem sản phẩm
  - `create:Product` - Tạo sản phẩm và bảng giá
  - `update:Product` - Cập nhật sản phẩm và bảng giá
  - `delete:Product` - Xóa sản phẩm và bảng giá
- Được kiểm tra qua `@CheckPermission(action, subject)` decorator

### 3. Multi-tenant Isolation
- Bắt buộc có header `x-store-id` hoặc `x-subdomain`
- User chỉ thao tác trên store mà họ thuộc về
- Sử dụng `@CurrentStore()` decorator để lấy storeId
- Tất cả queries tự động filter theo `StoreID`

---

## Permissions Seed Data

Permissions đã được thêm vào seed file:

```typescript
// Product Permissions
{ Action: 'read', Subject: 'Product' }
{ Action: 'create', Subject: 'Product' }
{ Action: 'update', Subject: 'Product' }
{ Action: 'delete', Subject: 'Product' }

// Order Permissions (for future use)
{ Action: 'read', Subject: 'Order' }
{ Action: 'create', Subject: 'Order' }

// Cost & Report Permissions
{ Action: 'read', Subject: 'CostPrice' }
{ Action: 'read', Subject: 'ProfitReport' }
```

**Role Assignments:**

- **Chủ cửa hàng:** `manage:all` (tất cả quyền)
- **Nhân viên:** 
  - `read:Product`
  - `create:Product`
  - `update:Product`
  - `delete:Product`
  - `read:Order`
  - `create:Order`

---

## Best Practices Implemented

### 1. DTOs với Validation
```typescript
export class CreateProductDto {
  @IsString()
  productName!: string;

  @IsInt()
  categoryId!: number;

  @IsString()
  @IsOptional()
  sku?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUnitDto)
  @IsOptional()
  units?: ProductUnitDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PriceListDto)
  @IsOptional()
  prices?: PriceListDto[];
}
```

### 2. Nested Creates
- Tạo Product cùng lúc với Units và Prices
- Sử dụng Prisma nested creates
- Giảm số lượng API calls

### 3. Service Layer Pattern
- Business logic tách riêng khỏi Controllers
- Reusable services
- Dễ dàng testing

### 4. Error Handling
```typescript
if (!category) {
  throw new NotFoundException(
    'Category not found or does not belong to this store'
  );
}

if (existingSKU) {
  throw new ConflictException('SKU already exists in this store');
}
```

### 5. Database Relations
```typescript
include: {
  category: {
    select: {
      CategoryID: true,
      CategoryName: true,
    },
  },
  units: true,
  prices: true,
}
```

### 6. Soft Delete Pattern
- Không xóa dữ liệu vật lý
- Set `IsActive = false`
- Giữ lại lịch sử giao dịch
- Có thể khôi phục sau này

### 7. Price Calculation Logic
- Tự động chọn giá tốt nhất cho khách hàng
- Dựa trên số lượng mua (MinQuantity)
- Trả về cả danh sách giá khả dụng
- Tính tổng tiền tự động

---

## API Summary

Tổng cộng **11 endpoints** cho Product Management:

### Basic CRUD (6 endpoints)
1. POST `/products` - Tạo sản phẩm
2. GET `/products` - Danh sách sản phẩm (có filtering)
3. GET `/products/:id` - Chi tiết sản phẩm
4. PATCH `/products/:id` - Cập nhật sản phẩm
5. DELETE `/products/:id` - Xóa mềm
6. DELETE `/products/:id/hard` - Xóa vĩnh viễn

### Unit Calculation (1 endpoint)
7. POST `/products/:id/calculate` - Tính toán đơn vị

### Price Management (4 endpoints)
8. POST `/products/:id/prices` - Thêm bảng giá
9. PATCH `/products/:id/prices/:priceId` - Cập nhật bảng giá
10. DELETE `/products/:id/prices/:priceId` - Xóa bảng giá
11. GET `/products/:id/prices/applicable?quantity=X` - Lấy giá phù hợp

---

## Testing Checklist

### ✅ Đã test
- [x] Tạo sản phẩm với units và prices
- [x] Filter theo search, categoryId, isActive
- [x] Multi-tenant isolation (không thấy sản phẩm của store khác)
- [x] Permission-based access control
- [x] SKU uniqueness trong store
- [x] Soft delete và hard delete
- [x] Unit calculation (Pallet → Viên)
- [x] Price selection dựa trên quantity
- [x] Thêm/sửa/xóa bảng giá
- [ ] Category management (create/update/delete)
- [ ] Batch operations
- [ ] Performance với nhiều sản phẩm
- [ ] Import/Export sản phẩm từ Excel

---
