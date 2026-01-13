# Giai đoạn 10: Báo cáo, Công nợ và Tối ưu hóa (Reporting & Debt Management)
---
## Tổng quan

Giai đoạn này chuyển đổi các con số giao dịch thành các chỉ số kinh doanh quan trọng:
- **Revenue Reports** - Báo cáo doanh thu theo khoảng thời gian
- **Profit Reports** - Phân tích lợi nhuận dựa trên giá vốn
- **Top Products** - Thống kê sản phẩm bán chạy nhất
- **Customer Debts** - Quản lý công nợ khách hàng
- **Supplier Debts** - Quản lý công nợ nhà cung cấp
- **Payment Recording** - Ghi nhận thanh toán công nợ
- **Inventory Audit Log** - Lịch sử biến động kho (schema ready)

---

## Nhiệm vụ đã thực hiện

### Task 27: Cập nhật Schema cho Báo cáo và Công nợ

**Migration**: `20260113143508_add_reporting_debt_fields`

#### Schema Changes

**1. Order Table - Thêm PaidAmount & Status:**
```prisma
model Order {
  OrderID      Int      @id @default(autoincrement())
  StoreID      Int
  CustomerID   Int?
  UserID       Int
  OrderDate    DateTime @default(now())
  TotalAmount  Decimal  @db.Decimal(18, 2)
  PaidAmount   Decimal  @db.Decimal(18, 2) @default(0) // ✅ NEW
  Status       String   @default("Completed") @db.VarChar(50) // ✅ NEW
  Note         String?  @db.Text

  // Status values: "Completed", "Pending", "Cancelled"
}
```

**2. OrderDetail Table - Thêm CostPrice:**
```prisma
model OrderDetail {
  DetailID     Int      @id @default(autoincrement())
  OrderID      Int
  ProductID    Int
  UnitName     String   @db.VarChar(50)
  Quantity     Decimal  @db.Decimal(18, 2)
  UnitPrice    Decimal  @db.Decimal(18, 2) // Giá bán
  CostPrice    Decimal  @db.Decimal(18, 2) @default(0) // ✅ NEW - Giá vốn
}
```

**3. StockReceipt Table - Thêm PaidAmount:**
```prisma
model StockReceipt {
  ReceiptID    Int      @id @default(autoincrement())
  StoreID      Int
  SupplierID   Int
  ImportDate   DateTime @default(now())
  TotalAmount  Decimal  @db.Decimal(18, 2)
  PaidAmount   Decimal  @db.Decimal(18, 2) @default(0) // ✅ NEW
  Note         String?  @db.Text
}
```

**4. InventoryLog Table - NEW Model:**
```prisma
model InventoryLog {
  LogID          Int      @id @default(autoincrement())
  StoreID        Int
  ProductID      Int
  ChangeType     String   @db.VarChar(50) // IN, OUT, ADJUST, RETURN
  ReferenceType  String?  @db.VarChar(50) // Order, StockReceipt, Manual
  ReferenceID    Int?     // Link đến Order hoặc StockReceipt
  OldQuantity    Decimal  @db.Decimal(18, 2)
  ChangeQuantity Decimal  @db.Decimal(18, 2) // Dương = tăng, Âm = giảm
  NewQuantity    Decimal  @db.Decimal(18, 2)
  Note           String?  @db.Text
  CreatedBy      Int?     // UserID
  CreatedAt      DateTime @default(now())

  product        Product  @relation(fields: [ProductID], references: [ProductID])

  @@index([StoreID])
  @@index([ProductID])
  @@index([ReferenceType, ReferenceID])
  @@index([CreatedAt])
}
```

**Lý do thay đổi:**
- **PaidAmount**: Để tính công nợ = TotalAmount - PaidAmount
- **Status**: Phân biệt đơn hoàn thành/đang chờ/đã hủy
- **CostPrice**: Lưu giá vốn tại thời điểm bán để tính lợi nhuận chính xác
- **InventoryLog**: Audit trail cho mọi biến động kho

---

### Task 28: API Báo cáo Doanh thu và Lợi nhuận

#### Module: `reports`

**Files tạo:**
- `src/modules/reports/reports.module.ts`
- `src/modules/reports/reports.controller.ts`
- `src/modules/reports/reports.service.ts`
- `src/modules/reports/dto/report-query.dto.ts`

#### API Endpoints

**1. GET /reports/revenue - Báo cáo Doanh thu**

Tính tổng doanh thu từ các đơn hàng trong khoảng thời gian.

**Query Parameters:**
```typescript
{
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
```

**Response:**
```typescript
{
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  totalRevenue: 150000000,  // Tổng TotalAmount
  totalOrders: 45           // Số lượng đơn hàng
}
```

**Permission Required:** `read Report`

---

**2. GET /reports/profit - Báo cáo Lợi nhuận**

Tính lợi nhuận theo công thức: **Profit = Σ(Quantity × (UnitPrice - CostPrice))**

**Query Parameters:**
```typescript
{
  startDate: string;
  endDate: string;
}
```

**Response:**
```typescript
{
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  totalRevenue: 150000000,    // Tổng doanh thu
  totalCost: 120000000,       // Tổng giá vốn
  totalProfit: 30000000,      // Lợi nhuận
  profitMargin: 20.0          // % lợi nhuận (Profit/Revenue * 100)
}
```

**Permission Required:** `read ProfitReport`

---

**3. GET /reports/top-products - Top Sản phẩm bán chạy**

Thống kê sản phẩm bán chạy nhất theo doanh thu hoặc số lượng.

**Query Parameters:**
```typescript
{
  startDate: string;
  endDate: string;
  sortBy?: 'revenue' | 'quantity'; // Default: 'revenue'
  limit?: number;                   // Default: 10
}
```

**Response:**
```typescript
{
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  sortBy: "revenue",
  products: [
    {
      productId: 1,
      productName: "Xi măng Trắng Nghi Sơn",
      sku: "XM-TN-001",
      baseUnit: "Bao",
      totalQuantity: 5000,        // Tổng số lượng bán (đã quy đổi)
      totalRevenue: 25000000      // Tổng doanh thu
    },
    // ... top 10 products
  ]
}
```

**Permission Required:** `read Report`

---

### Task 29: API Quản lý Công nợ (Debt Management)

#### Module: `debts`

**Files tạo:**
- `src/modules/debts/debts.module.ts`
- `src/modules/debts/debts.controller.ts`
- `src/modules/debts/debts.service.ts`
- `src/modules/debts/dto/payment.dto.ts`

#### API Endpoints

**1. GET /debts/customers - Công nợ Khách hàng**

Lấy danh sách khách hàng còn nợ tiền.

**Calculation:** `Debt = TotalAmount - PaidAmount`

**Response:**
```typescript
{
  totalCustomersInDebt: 5,
  totalDebtAmount: 35000000,
  customers: [
    {
      customerId: 1,
      customerName: "Công ty TNHH ABC",
      phone: "0901234567",
      totalDebt: 20000000,
      orders: [
        {
          orderId: 10,
          orderDate: "2026-01-10T10:00:00Z",
          totalAmount: 30000000,
          paidAmount: 10000000,
          remainingAmount: 20000000
        }
      ]
    },
    {
      customerId: null,      // Khách vãng lai
      customerName: "Khách vãng lai",
      phone: null,
      totalDebt: 5000000,
      orders: [...]
    }
  ]
}
```

**Permission Required:** `read Debt`

---

**2. GET /debts/suppliers - Công nợ Nhà cung cấp**

Lấy danh sách nhà cung cấp còn nợ tiền.

**Calculation:** `Debt = TotalAmount - PaidAmount`

**Response:**
```typescript
{
  totalSuppliersInDebt: 3,
  totalDebtAmount: 80000000,
  suppliers: [
    {
      supplierId: 1,
      supplierName: "Nhà máy Xi măng Hoàng Thạch",
      phone: "0987654321",
      totalDebt: 50000000,
      receipts: [
        {
          receiptId: 5,
          importDate: "2026-01-05T14:00:00Z",
          totalAmount: 100000000,
          paidAmount: 50000000,
          remainingAmount: 50000000
        }
      ]
    }
  ]
}
```

**Permission Required:** `read Debt`

---

**3. POST /debts/payment - Ghi nhận thanh toán**

Cập nhật số tiền đã thanh toán cho đơn hàng hoặc phiếu nhập.

**Request Body:**
```typescript
{
  type: 'customer' | 'supplier',  // Loại thanh toán
  referenceId: number,            // OrderID hoặc ReceiptID
  amount: number,                 // Số tiền thanh toán
  note?: string                   // Ghi chú
}
```

**Response - Customer Payment:**
```typescript
{
  type: "customer",
  orderId: 10,
  paymentAmount: 5000000,
  totalAmount: 30000000,
  paidAmount: 15000000,          // PaidAmount sau khi cộng
  remainingAmount: 15000000,      // Còn lại
  isFullyPaid: false,
  note: "Thanh toán đợt 2"
}
```

**Response - Supplier Payment:**
```typescript
{
  type: "supplier",
  receiptId: 5,
  paymentAmount: 20000000,
  totalAmount: 100000000,
  paidAmount: 70000000,
  remainingAmount: 30000000,
  isFullyPaid: false,
  note: "Trả tiền NCC đợt 3"
}
```

**Permission Required:** `manage Debt`

**Xử lý khi thanh toán thừa:** Hiện tại strict validation (throw error). Options:
- Option 1 (current): Reject payment nếu amount > remainingAmount
- Option 2: Auto-limit payment = min(amount, remainingAmount)
- Option 3: Lưu credit vào Customer/Supplier balance (cần thêm field)

---

### Task 30: API Cảnh báo Tồn kho & Dự báo (Chưa triển khai)

**Planned Features:**
- **Low Stock Alert**: Sản phẩm có số lượng tồn < MinThreshold
- **Deadstock Analysis**: Sản phẩm không có OrderDetail trong X ngày
- **Forecast**: Dự báo nhu cầu nhập hàng dựa trên lịch sử bán

---

## Permissions được thêm

Đã seed vào database:

```typescript
// Task 28 - Reports
{ Action: 'read', Subject: 'Report' }         // Xem báo cáo doanh thu, top sản phẩm
{ Action: 'read', Subject: 'ProfitReport' }   // Xem báo cáo lợi nhuận (sensitive)

// Task 29 - Debts
{ Action: 'read', Subject: 'Debt' }           // Xem công nợ khách/NCC
{ Action: 'manage', Subject: 'Debt' }         // Ghi nhận thanh toán
```

**Permission Strategy:**
- `read Report`: Cho phép xem doanh thu và top products (less sensitive)
- `read ProfitReport`: Riêng biệt vì thông tin lợi nhuận nhạy cảm hơn
- `read Debt`: Xem danh sách công nợ
- `manage Debt`: Được phép ghi nhận thanh toán (cập nhật PaidAmount)

---

## Architecture Decisions

### 1. Tại sao lưu CostPrice trong OrderDetail?

**Problem:** Giá nhập hàng (StockReceiptDetail.UnitPrice) thay đổi theo thời gian.

**Solution:** Lưu CostPrice tại thời điểm bán để tính lợi nhuận chính xác.

**Ví dụ:**
```
T1: Nhập 1000 bao xi măng @ 150k/bao
T2: Bán 500 bao @ 180k/bao → CostPrice = 150k
T3: Nhập 1000 bao @ 160k/bao (giá tăng)
T4: Bán 500 bao @ 190k/bao → CostPrice = 160k (weighted average hoặc FIFO)
```

**Hiện tại:** CostPrice mặc định = 0, cần update logic trong OrdersService để tính từ StockReceiptDetail.

---

### 2. PaidAmount vs Status trong Order

**PaidAmount:** Số tiền khách đã trả (có thể trả từng đợt)  
**Status:** Trạng thái đơn hàng

**Status Values:**
- `Completed`: Đơn đã hoàn tất (mặc định khi tạo)
- `Pending`: Đơn đang chờ xử lý (optional)
- `Cancelled`: Đơn đã hủy (không tính vào báo cáo)

**Debt Calculation:** Chỉ dựa vào PaidAmount, không phụ thuộc Status.

**Ví dụ:**
```
Order {
  TotalAmount: 30,000,000
  PaidAmount: 10,000,000
  Status: "Completed"
  Debt: 20,000,000 ← Còn nợ
}
```

---

### 3. Gom nhóm Debts theo Customer/Supplier

**Lý do:** Quản lý công nợ theo đối tác, không theo từng đơn riêng lẻ.

**Benefits:**
- Nhìn tổng quan nợ của từng khách/NCC
- Dễ dàng đàm phán thanh toán
- Phát hiện khách nợ nhiều cần ưu tiên thu hồi

**Implementation:**
```typescript
// Gom nhóm bằng Map
const customerMap = new Map<CustomerId, CustomerDebtInfo>();

for (const order of orders) {
  if (customerMap.has(order.CustomerID)) {
    // Cộng dồn debt
    existing.totalDebt += remainingAmount;
    existing.orders.push(orderInfo);
  } else {
    // Khởi tạo entry mới
    customerMap.set(order.CustomerID, {...});
  }
}
```

---

### 4. Xử lý Khách vãng lai (CustomerID = null)

**Scenario:** Đơn hàng bán cho khách không có thông tin (walk-in customer).

**Implementation:**
- CustomerID = null trong Order
- Hiển thị là "Khách vãng lai" trong debt list
- Nhóm tất cả đơn vãng lai vào 1 entry với customerId = null

**Limitation:** Không thể tracking từng khách vãng lai riêng lẻ.

---

### 5. Transaction Safety trong Payment Recording

**Current:** Không sử dụng transaction vì chỉ update 1 row.

**Future Enhancement:**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Update PaidAmount
  await tx.order.update({...});
  
  // 2. Log payment history (cần thêm PaymentLog table)
  await tx.paymentLog.create({
    OrderID, Amount, PaymentDate, Note
  });
  
  // 3. Optional: Update customer credit balance
  await tx.customer.update({
    CreditBalance: { increment: excessAmount }
  });
});
```

---

## Common Issues & Solutions

### Issue 1: Profit report trả về 0

**Cause:** OrderDetail.CostPrice = 0 (default)

**Solution:** Cập nhật OrdersService để tính CostPrice khi tạo đơn:
```typescript
// Lấy giá nhập gần nhất từ StockReceiptDetail
const latestReceipt = await prisma.stockReceiptDetail.findFirst({
  where: { ProductID, UnitName },
  orderBy: { receipt: { ImportDate: 'desc' } },
  select: { UnitPrice }
});

const costPrice = latestReceipt?.UnitPrice || 0;
```

---

### Issue 2: Customer debt không chính xác

**Cause:** Đơn hàng đã hủy (Status = 'Cancelled') vẫn được tính

**Solution:** Filter Status trong query:
```typescript
where: {
  StoreID: storeId,
  Status: { not: 'Cancelled' }, // ✅ Bắt buộc
  PaidAmount: { lt: TotalAmount }
}
```

---

### Issue 3: Payment validation thất bại

**Error:** "Số tiền thanh toán vượt quá số tiền còn nợ"

**Cause:** Race condition hoặc PaidAmount đã được update ở nơi khác

**Solution:**
1. Refresh order trước khi validate
2. Sử dụng optimistic locking (version field)
3. Frontend phải refresh debt list sau mỗi payment

---

## Performance Considerations

### 1. Indexing Strategy

**Existing Indexes:**
```prisma
// Order table
@@index([StoreID])
@@index([CustomerID])
@@index([UserID])

// StockReceipt table
@@index([StoreID])
@@index([SupplierID])

// InventoryLog table
@@index([StoreID])
@@index([ProductID])
@@index([ReferenceType, ReferenceID])
@@index([CreatedAt])
```

**Query Optimization:**
- Filter by StoreID first (tenant isolation)
- Date range queries use OrderDate/ImportDate
- Status filter sử dụng string comparison (consider enum)

---

### 2. N+1 Query Problem

**Problem:** Khi lấy debt list, mỗi order phải join customer

**Solution:** Sử dụng `select` với nested relation:
```typescript
const orders = await prisma.order.findMany({
  where: {...},
  select: {
    OrderID, TotalAmount, PaidAmount,
    customer: { select: { CustomerName, Phone } } // ✅ Single query
  }
});
```

**Result:** 1 query với LEFT JOIN thay vì N+1 queries.

---

### 3. Report Performance

**Challenge:** Top Products query scan toàn bộ OrderDetail

**Optimization:**
1. **Date range index:** OrderDate indexed
2. **Aggregation in memory:** Group by ProductID trong application
3. **Future:** Pre-aggregate reports (materialized view hoặc cache)

**Consider Caching:**
```typescript
// Cache report results cho 1 giờ
const cacheKey = `report:profit:${storeId}:${startDate}:${endDate}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await calculateProfit(...);
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

---