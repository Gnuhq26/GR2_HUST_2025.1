# Virtual Inventory — Tài Liệu Nghiệp Vụ & Triển Khai

## 1. Bối Cảnh Nghiệp Vụ

### Vấn đề với mô hình tồn kho đơn giản

Hệ thống POS truyền thống chỉ lưu một con số tồn kho duy nhất (`Quantity`). Mô hình này đúng trong thế giới lý tưởng — hàng về kho ngay lập tức, khách mua xong lấy hàng ngay. Nhưng thực tế ở các cửa hàng bán vật liệu xây dựng, thực phẩm, hàng sỉ, tình huống phức tạp hơn nhiều:

| Tình huống thực tế | Vấn đề với tồn kho đơn giản |
|---|---|
| Đặt hàng nhà cung cấp, hàng đang trên đường về | Kho hiển thị 0, khách hỏi mua thì không dám nhận — mất đơn |
| Khách đặt trước, hẹn tuần sau đến lấy | Nhân viên khác bán mất hàng đó cho người khác |
| Xe hàng đến, một phần giao thẳng cho khách đang chờ ngoài sân | Không thể ghi nhận đồng thời việc nhập và bán |

### Giải pháp: Tách tồn kho thành 3 bucket

```
┌─────────────────────────────────────────────────────────┐
│                  Inventory Record                        │
├─────────────────┬──────────────────┬────────────────────┤
│    Quantity     │  InTransitQty    │   ReservedQty      │
│  (Tồn vật lý)  │ (Hàng đang về)   │ (Đã khóa cho KH)  │
└─────────────────┴──────────────────┴────────────────────┘

AvailableQty = Quantity + InTransitQty - ReservedQty
```

| Bucket | Ý nghĩa | Ví dụ |
|---|---|---|
| `Quantity` | Hàng vật lý đang trong kho, có thể cầm tay được | 500 viên gạch đang xếp trong kho |
| `InTransitQty` | Đã đặt NCC, chưa về — nhưng chắc chắn sẽ về | 1.000 viên trên xe đang chạy |
| `ReservedQty` | Hàng trong kho đã được "khóa" cho khách cụ thể | 200 viên khách A đặt trước, tuần sau lấy |
| `AvailableQty` | Tổng số có thể cam kết bán thêm | 500 + 1.000 − 200 = **1.300 viên** |

---

## 2. Data Model

### 2.1 Bảng `Inventory`

```prisma
model Inventory {
  InventoryID  Int
  StoreID      Int
  ProductID    Int
  Quantity     Decimal  // Tồn vật lý (BaseUnit)
  ReservedQty  Decimal  // Khóa cho khách đặt trước
  InTransitQty Decimal  // Hàng đang trên đường về
  LastUpdated  DateTime
}
```

**Quy tắc quan trọng:** Ba con số này **độc lập** với nhau. Tăng/giảm một bucket không tự động ảnh hưởng bucket khác. Chỉ khi có sự kiện nghiệp vụ cụ thể (nhận hàng về, khách lấy hàng,...) thì mới chuyển đổi giữa các bucket.

### 2.2 Bảng `StockReceipt` — Phiếu nhập kho

Bổ sung trường `Status`:

| Giá trị | Ý nghĩa |
|---|---|
| `Pending` | Đã đặt hàng NCC, hàng chưa về — tăng `InTransitQty` |
| `Received` | Hàng đã vào kho vật lý — tăng `Quantity` |

### 2.3 Bảng `Order` — Đơn hàng bán

Bổ sung hai trường:

| Trường | Ý nghĩa |
|---|---|
| `DeliveryMethod` | Cách xử lý tồn kho khi bán (`Immediate` / `Reserved` / `DirectShip`) |
| `LinkedReceiptID` | FK trỏ tới `StockReceipt` — chỉ dùng cho luồng DirectShip để truy vết |

### 2.4 Bảng `InventoryLog` — Audit trail

Bổ sung trường `QuantityType` — phân biệt biến động xảy ra ở bucket nào:

| Giá trị | Ghi khi nào |
|---|---|
| `Physical` | `Quantity` tăng hoặc giảm |
| `InTransit` | `InTransitQty` tăng hoặc giảm |
| `Reserved` | `ReservedQty` tăng hoặc giảm |

---

## 3. Luồng Nghiệp Vụ Chi Tiết

### Luồng A — Nhập kho thông thường (Received)

**Kịch bản:** Xe hàng vừa đến, kiểm đếm xong, nhập kho ngay.

```
API: POST /inventory/stock-in
Body: { supplierId, items: [...], status: "Received" }
```

**Diễn biến:**

```
Trước:  Quantity=500  InTransitQty=0   ReservedQty=200
Nhập:   +1.000 viên (status=Received)
Sau:    Quantity=1500 InTransitQty=0   ReservedQty=200

AvailableQty: 500+0-200=300  →  1500+0-200=1300
```

**Bảng ghi:**
- `StockReceipt` mới: `Status = Received`, `TotalAmount` = tiền nhập
- `Inventory.Quantity += 1.000`
- `InventoryLog`: `ChangeType=IN`, `QuantityType=Physical`, `+1.000`

---

### Luồng B — Đặt hàng NCC, hàng chưa về (Pending)

**Kịch bản:** Gọi điện NCC đặt hàng hôm nay, 3 ngày nữa xe mới về. Khách hỏi mua hàng đó thì vẫn muốn nhận đơn.

```
API: POST /inventory/stock-in
Body: { supplierId, items: [...], status: "Pending" }
```

**Diễn biến:**

```
Trước:  Quantity=500  InTransitQty=0     ReservedQty=200
Đặt:    +1.000 viên (status=Pending)
Sau:    Quantity=500  InTransitQty=1000  ReservedQty=200

AvailableQty: 500+0-200=300  →  500+1000-200=1300
```

**Bảng ghi:**
- `StockReceipt` mới: `Status = Pending`
- `Inventory.InTransitQty += 1.000` (Quantity không đổi)
- `InventoryLog`: `ChangeType=IN`, `QuantityType=InTransit`, `+1.000`

**Khi hàng về thực tế** → gọi Luồng B2.

---

### Luồng B2 — Xác nhận hàng về (fulfill Pending receipt)

**Kịch bản:** Xe hàng đã về, kiểm đếm xong, đóng phiếu Pending.

```
API: POST /inventory/receipts/:receiptId/receive
```

**Diễn biến:**

```
Trước:  Quantity=500  InTransitQty=1000
Xác nhận ReceiptID=7 (1.000 viên đang Pending)
Sau:    Quantity=1500 InTransitQty=0

AvailableQty không đổi (1300), nhưng cơ cấu thay đổi:
  hàng "trên đường" → hàng "vật lý"
```

**Bảng ghi per item:**
- `Inventory.InTransitQty -= 1.000`
- `Inventory.Quantity += 1.000`
- `InventoryLog` #1: `ChangeType=IN`, `QuantityType=InTransit`, `−1.000`
- `InventoryLog` #2: `ChangeType=IN`, `QuantityType=Physical`, `+1.000`
- `StockReceipt.Status` → `Received`

---

### Luồng C — Bán hàng ngay (Immediate)

**Kịch bản:** Khách đến tận kho, mua 10 thùng, lấy hàng luôn.

```
API: POST /orders
Body: { items: [...], DeliveryMethod: "Immediate" }
```

**Diễn biến:**

```
Trước:  Quantity=1500 InTransitQty=0   ReservedQty=200
        AvailableQty = 1500+0-200 = 1300 ≥ 600 (10 thùng × 60 viên) ✓
Bán:    −600 viên
Sau:    Quantity=900  InTransitQty=0   ReservedQty=200
```

**Các bước trong transaction:**
1. Tính `AvailableQty`, so sánh với số cần bán → nếu không đủ thì báo lỗi
2. Lookup `StockReceiptDetail` gần nhất → tính `CostPrice` cho từng item
3. Lookup `PriceList` theo `UnitName + MinQuantity` → xác định `UnitPrice`
4. Trừ `Quantity`
5. Tạo `Order` + `OrderDetail` (có `CostPrice` đúng)
6. Ghi `InventoryLog`: `ChangeType=OUT`, `QuantityType=Physical`, `−600`

---

### Luồng D — Khách đặt trước, lấy sau (Reserved)

**Kịch bản:** Khách xây nhà gọi điện đặt 500 viên gạch, tuần sau mới sang chở. Cần "khóa" hàng đó lại, không để nhân viên bán cho người khác.

```
API: POST /orders
Body: { items: [...], DeliveryMethod: "Reserved" }
```

**Diễn biến:**

```
Trước:  Quantity=900  InTransitQty=0   ReservedQty=200
        AvailableQty = 900+0-200 = 700 ≥ 500 ✓
Đặt:    +500 vào ReservedQty (Quantity không đổi)
Sau:    Quantity=900  InTransitQty=0   ReservedQty=700

AvailableQty: 700 → 900+0-700 = 200
```

**Quan trọng:** `Quantity` vẫn là 900, nhưng nhân viên chỉ được bán thêm 200 viên — vì 700 đã bị khóa.

**Bảng ghi:**
- `Order.DeliveryMethod = Reserved`
- `Inventory.ReservedQty += 500`
- `InventoryLog`: `ChangeType=OUT`, `QuantityType=Reserved`, `+500`

**Khi khách đến lấy hàng thực tế:**

Hiện tại cần gọi `POST /orders` với `DeliveryMethod: Immediate` cho đơn xuất thực tế, sau đó xử lý bù trừ `ReservedQty` thủ công hoặc qua flow riêng.

---

### Luồng E — Giao thẳng (DirectShip)

**Kịch bản:** Xe hàng 20 thùng của NCC vừa đến. Khách A đang đứng ngoài sân chờ lấy 8 thùng. Nhân viên muốn: ghi nhận nhập 20 thùng + bán 8 thùng cho khách A + chỉ đưa 12 thùng còn lại vào kho — **trong một thao tác duy nhất**.

```
API: POST /inventory/direct-ship
Body: {
  supplierId: 3,
  productId: 1,
  unitName: "Thùng",
  totalQty: 20,       // tổng hàng trên xe
  deliverQty: 8,      // giao thẳng cho khách
  importUnitPrice: 120000,
  saleUnitPrice: 140000,
  customerId: 10
}
```

**Diễn biến:**

```
Trước:  Quantity=300  InTransitQty=0   ReservedQty=0

Giao thẳng: totalQty=20, deliverQty=8
  → stockQty = 20 - 8 = 12 thùng vào kho

Sau:    Quantity=312  InTransitQty=0   ReservedQty=0
```

**Transaction atomically làm 4 việc:**

```
1. Tạo StockReceipt (20 thùng, Status=Received, TotalAmount=20×120.000=2.400.000)
2. Tạo Order (8 thùng, DeliveryMethod=DirectShip, LinkedReceiptID=receiptId)
   └── OrderDetail: UnitPrice=140.000, CostPrice=120.000
3. Inventory.Quantity += 12 (chỉ phần còn lại)
4. InventoryLog: ChangeType=IN, QuantityType=Physical, +12 thùng (quy về BaseUnit)
```

**Tại sao chỉ cộng 12 chứ không phải 20?**

Vì 8 thùng giao thẳng không qua kho — không bao giờ nằm trong kho. Nếu cộng 20 rồi trừ 8, kho sẽ thoáng qua hiển thị số sai trong cùng transaction.

**Truy vết:** `Order.LinkedReceiptID = StockReceipt.ReceiptID` — có thể biết đơn hàng này đến từ chuyến xe nào.

---

## 4. Tóm Tắt Ánh Xạ: Sự Kiện → Biến Động Kho

| Sự kiện nghiệp vụ | API endpoint | Quantity | InTransitQty | ReservedQty |
|---|---|---|---|---|
| Nhập kho ngay | `POST /inventory/stock-in` (`Received`) | **+qty** | — | — |
| Đặt hàng NCC (chưa về) | `POST /inventory/stock-in` (`Pending`) | — | **+qty** | — |
| Hàng Pending về tới | `POST /inventory/receipts/:id/receive` | **+qty** | **−qty** | — |
| Bán hàng ngay | `POST /orders` (`Immediate`) | **−qty** | — | — |
| Khách đặt trước | `POST /orders` (`Reserved`) | — | — | **+qty** |
| Giao thẳng | `POST /inventory/direct-ship` | **+(total−deliver)** | — | — |

---

## 5. Quy Tắc Tính `AvailableQty`

```
AvailableQty = Quantity + InTransitQty - ReservedQty
```

Công thức này được áp dụng **đồng nhất** ở mọi nơi kiểm tra tồn kho:

- **Khi tạo đơn hàng** (`orders.service.ts`): so sánh `AvailableQty >= quantityInBaseUnit` trước khi cho phép bán
- **Khi trả về danh sách tồn kho** (`inventory.service.ts → getInventory`): tính `AvailableQty` cho từng dòng, dùng để filter `lowStockThreshold`

**Lưu ý:** Kiểm tra tồn kho luôn dùng `AvailableQty`, không bao giờ dùng `Quantity` đơn thuần — vì nếu dùng `Quantity`, sẽ bán vào hàng đã bị khóa cho khách khác.

---

## 6. Tính Giá Vốn (`CostPrice`) Khi Bán

Khi tạo đơn hàng, mỗi `OrderDetail` lưu `CostPrice` theo đơn vị bán để tính lợi nhuận chính xác.

**Thuật toán:**

```
1. Tìm StockReceiptDetail gần nhất của sản phẩm (Status=Received, ImportDate desc)
2. Tính costPerBase = receiptUnitPrice / receiptExchangeValue
   (quy về giá trên 1 BaseUnit)
3. CostPrice = costPerBase × saleExchangeValue
   (chuyển sang đơn vị bán)
```

**Ví dụ:**
```
Nhập:  1 Pallet = 500 viên, giá 50.000đ/Pallet
       costPerBase = 50.000 / 500 = 100đ/viên

Bán:   theo Thùng (1 Thùng = 6 viên, saleExchangeValue=6)
       CostPrice = 100 × 6 = 600đ/Thùng

Báo cáo lợi nhuận:
  UnitPrice = 140.000, CostPrice = 600
  Profit/Thùng = 140.000 - 600 = 139.400đ  ✓
```

---

## 7. Audit Trail — `InventoryLog`

Mọi biến động tồn kho đều được ghi vào `InventoryLog`. Mỗi record chứa đủ thông tin để trả lời: **"Tồn kho thay đổi bởi ai, vì lý do gì, bao nhiêu, lúc nào?"**

| Trường | Giá trị ví dụ | Ý nghĩa |
|---|---|---|
| `ChangeType` | `IN` / `OUT` / `ADJUST` | Hướng biến động |
| `QuantityType` | `Physical` / `InTransit` / `Reserved` | Bucket nào bị ảnh hưởng |
| `ReferenceType` | `Order` / `StockReceipt` / `DirectShip` | Nguồn gốc sự kiện |
| `ReferenceID` | `42` | ID của Order/Receipt cụ thể |
| `OldQuantity` | `500` | Giá trị trước khi thay đổi |
| `ChangeQuantity` | `−60` (âm = giảm) | Lượng thay đổi |
| `NewQuantity` | `440` | Giá trị sau khi thay đổi |
| `CreatedBy` | `UserID=3` | Nhân viên thực hiện |

**Ví dụ audit trail của 1 sản phẩm trong một ngày:**

```
08:00  IN  | InTransit | +1000  | StockReceipt #7  (đặt hàng NCC)
13:30  IN  | InTransit |  −1000 | StockReceipt #7  (hàng về, fulfill)
13:30  IN  | Physical  | +1000  | StockReceipt #7  (hàng về, fulfill)
14:00  OUT | Physical  |  −600  | Order #42        (bán 10 Thùng)
15:00  OUT | Reserved  |  +500  | Order #43        (khách B đặt trước)
```

---

## 8. Các File Triển Khai

| File | Thay đổi chính |
|---|---|
| `prisma/schema.prisma` | Thêm `InTransitQty`, `ReservedQty` vào `Inventory`; `Status` vào `StockReceipt`; `DeliveryMethod`, `LinkedReceiptID` vào `Order`; `QuantityType` vào `InventoryLog` |
| `prisma/migrations/20260319161706_add_virtual_inventory/migration.sql` | SQL ALTER TABLE tương ứng |
| `inventory/dto/create-stock-receipt.dto.ts` | Thêm `status?: 'Pending' \| 'Received'` |
| `inventory/dto/direct-ship.dto.ts` | DTO mới cho luồng DirectShip; `deliverQty @Min(0.01)` |
| `inventory/inventory.service.ts` | Phân nhánh Pending/Received; ghi `InventoryLog`; thêm `fulfillReceipt()` |
| `inventory/inventory.controller.ts` | Thêm `POST /direct-ship`; thêm `POST /receipts/:id/receive` |
| `orders/dto/create-order.dto.ts` | `DeliveryMethod: 'Immediate' \| 'Reserved'` (bỏ DirectShip) |
| `orders/orders.service.ts` | Tính `CostPrice` từ receipt; ghi `InventoryLog`; xử lý Reserved/Immediate đúng cách |

---

## 9. API Reference

### `POST /inventory/stock-in`
Tạo phiếu nhập kho.

```json
{
  "supplierId": 3,
  "status": "Pending",
  "note": "Dự kiến về ngày 5/4",
  "items": [
    { "productId": 1, "unitName": "Pallet", "quantity": 2, "unitPrice": 50000 }
  ]
}
```

- `status = "Received"` (default) → tăng `Quantity`
- `status = "Pending"` → tăng `InTransitQty`

---

### `POST /inventory/receipts/:receiptId/receive`
Xác nhận phiếu Pending đã nhận hàng thực tế.

- Yêu cầu: phiếu đang `Status = Pending`
- Kết quả: `InTransitQty -= qty`, `Quantity += qty` per item; `Status → Received`

---

### `POST /orders`
Tạo đơn hàng bán.

```json
{
  "CustomerID": 10,
  "DeliveryMethod": "Immediate",
  "items": [
    { "ProductID": 1, "UnitName": "Thùng", "Quantity": 10 }
  ]
}
```

| `DeliveryMethod` | Tác động kho |
|---|---|
| `Immediate` (default) | `Quantity -= qty` |
| `Reserved` | `ReservedQty += qty` |

> `DirectShip` **không** được phép qua endpoint này. Dùng `POST /inventory/direct-ship`.

---

### `POST /inventory/direct-ship`
Giao thẳng: nhập hàng và bán đồng thời trong một transaction.

```json
{
  "supplierId": 3,
  "productId": 1,
  "unitName": "Thùng",
  "totalQty": 20,
  "deliverQty": 8,
  "importUnitPrice": 120000,
  "saleUnitPrice": 140000,
  "customerId": 10,
  "note": "Giao tại công trình A"
}
```

- `deliverQty` phải > 0 và ≤ `totalQty`
- Kết quả: `Quantity += (totalQty − deliverQty)` quy về BaseUnit

---

## 10. Checklist Kiểm Tra Nghiệp Vụ

### Luồng A — Nhập thường
- [ ] Tạo receipt `status=Received` → `Quantity` tăng đúng số BaseUnit
- [ ] `InventoryLog` ghi: `ChangeType=IN`, `QuantityType=Physical`
- [ ] `InTransitQty` không thay đổi

### Luồng B → B2 — Pending → Receive
- [ ] Tạo receipt `status=Pending` → `InTransitQty` tăng, `Quantity` không đổi
- [ ] `AvailableQty` vẫn tính đúng (gồm InTransit)
- [ ] Gọi `/receipts/:id/receive` → `InTransitQty` giảm, `Quantity` tăng cùng lượng
- [ ] `InventoryLog` ghi 2 dòng: InTransit giảm + Physical tăng
- [ ] Gọi lại `/receive` trên phiếu đã Received → trả về `400 Bad Request`

### Luồng C — Bán Immediate
- [ ] `AvailableQty < qty` cần bán → từ chối, trả `400`
- [ ] Bán thành công → `Quantity` giảm đúng (quy về BaseUnit)
- [ ] `CostPrice` trong `OrderDetail` ≠ 0
- [ ] `InventoryLog`: `ChangeType=OUT`, `QuantityType=Physical`, giá trị âm

### Luồng D — Bán Reserved
- [ ] Bán Reserved → `ReservedQty` tăng, `Quantity` không đổi
- [ ] `AvailableQty` giảm (hàng bị khóa)
- [ ] Bán quá `AvailableQty` → từ chối dù `Quantity` còn

### Luồng E — DirectShip
- [ ] `deliverQty > totalQty` → `400 Bad Request`
- [ ] `deliverQty = 0` → `400 Bad Request` (validation `@Min(0.01)`)
- [ ] Thành công → tạo cả `StockReceipt` lẫn `Order`
- [ ] `Order.LinkedReceiptID = StockReceipt.ReceiptID`
- [ ] `Quantity += (totalQty − deliverQty)` × exchangeValue, không phải `totalQty`
- [ ] `InventoryLog` ghi đúng phần hàng vào kho thực tế

