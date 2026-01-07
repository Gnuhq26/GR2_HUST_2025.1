# Giai đoạn 6: API Quản trị nội bộ (Admin Tools)
---
## Tổng quan

Giai đoạn này triển khai các API cho phép Admin của cửa hàng quản lý:
- **Roles** (Vai trò)
- **Permissions** (Quyền hạn)
- **Store Members** (Nhân viên trong cửa hàng)

---

## Nhiệm vụ đã thực hiện

### API Quản lý Role

**Module**: `backend/src/modules/roles/`

#### Endpoints

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| GET | `/roles` | Liệt kê tất cả roles của store | `read Role` |
| GET | `/roles/:id` | Chi tiết một role | `read Role` |
| POST | `/roles` | Tạo role mới | `create Role` |
| PUT | `/roles/:id` | Cập nhật role | `update Role` |
| DELETE | `/roles/:id` | Xóa role | `delete Role` |

#### Ví dụ sử dụng

**1. Tạo Role mới:**
```http
POST /roles
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "roleName": "Kế toán kho",
  "description": "Quản lý kho hàng và báo cáo tài chính"
}

Response (201):
{
  "RoleID": 3,
  "StoreID": 1,
  "RoleName": "Kế toán kho",
  "Description": "Quản lý kho hàng và báo cáo tài chính",
  "CreatedAt": "2026-01-07T10:00:00.000Z",
  "UpdatedAt": "2026-01-07T10:00:00.000Z",
  "rolePermissions": []
}
```

**2. Cập nhật Role:**
```http
PUT /roles/3
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "roleName": "Trưởng phòng kế toán",
  "description": "Quản lý tài chính và nhân sự"
}
```

**3. Xóa Role:**
```http
DELETE /roles/3
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "message": "Role \"Kế toán kho\" deleted successfully"
}
```

**Lưu ý:**
- Role name phải unique trong store
- Không thể xóa role đang có user sử dụng
- Response GET /roles bao gồm số lượng users của mỗi role

---

### API Gán quyền cho Role

**Module**: `backend/src/modules/permissions/`

#### Endpoints

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| GET | `/permissions` | Liệt kê tất cả permissions | `read Permission` |
| GET | `/permissions/grouped` | Permissions nhóm theo Subject | `read Permission` |
| GET | `/permissions/:id` | Chi tiết một permission | `read Permission` |
| POST | `/roles/:id/permissions` | Gán permissions cho role | `update Role` |
| GET | `/roles/:id/permissions` | Xem permissions của role | `read Role` |

#### Ví dụ sử dụng

**1. Lấy danh sách Permissions:**
```http
GET /permissions
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "PermissionID": 1,
    "Action": "manage",
    "Subject": "all",
    "CreatedAt": "2026-01-01T00:00:00.000Z",
    "UpdatedAt": "2026-01-01T00:00:00.000Z"
  },
  {
    "PermissionID": 2,
    "Action": "read",
    "Subject": "Product",
    "CreatedAt": "2026-01-01T00:00:00.000Z",
    "UpdatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

**2. Lấy Permissions nhóm theo Subject:**
```http
GET /permissions/grouped
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "all": [
    { "PermissionID": 1, "Action": "manage", "Subject": "all" }
  ],
  "Product": [
    { "PermissionID": 2, "Action": "read", "Subject": "Product" },
    { "PermissionID": 3, "Action": "create", "Subject": "Product" }
  ],
  "Order": [
    { "PermissionID": 6, "Action": "read", "Subject": "Order" },
    { "PermissionID": 7, "Action": "create", "Subject": "Order" }
  ]
}
```

**3. Gán Permissions cho Role:**
```http
POST /roles/3/permissions
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "permissionIds": [2, 3, 4, 6, 7]
}

Response (200):
{
  "RoleID": 3,
  "RoleName": "Kế toán kho",
  "rolePermissions": [
    {
      "permission": {
        "PermissionID": 2,
        "Action": "read",
        "Subject": "Product"
      }
    },
    {
      "permission": {
        "PermissionID": 3,
        "Action": "create",
        "Subject": "Product"
      }
    }
  ]
}
```

**Lưu ý:**
- Gán permissions sẽ **replace** tất cả permissions cũ
- Tất cả permissionIds phải hợp lệ (tồn tại trong DB)
- GET /permissions/grouped tiện lợi cho UI checkbox

---

### API Quản lý nhân viên (Store Members)

**Module**: `backend/src/modules/stores/`

#### Endpoints

| Method | Endpoint | Description | Permission Required |
|--------|----------|-------------|---------------------|
| GET | `/stores/details` | Thông tin store hiện tại | `read Store` |
| GET | `/stores/members` | Danh sách members | `read User` |
| POST | `/stores/members` | Thêm member vào store | `create User` |
| PUT | `/stores/members/:userId/role` | Cập nhật role của member | `update User` |
| DELETE | `/stores/members/:userId` | Xóa member khỏi store | `delete User` |

#### Ví dụ sử dụng

**1. Xem danh sách Members:**
```http
GET /stores/members
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
[
  {
    "userId": 1,
    "storeId": 1,
    "user": {
      "UserID": 1,
      "Email": "admin@app.com",
      "FullName": "Admin User",
      "Phone": null,
      "Address": null,
      "CreatedAt": "2026-01-01T00:00:00.000Z"
    },
    "role": {
      "RoleID": 1,
      "RoleName": "Chủ cửa hàng",
      "Description": "Toàn quyền quản lý cửa hàng"
    },
    "joinedAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

**2. Thêm Member vào Store:**
```http
POST /stores/members
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "email": "staff@example.com",
  "roleId": 2
}

Response (201):
{
  "message": "User \"staff@example.com\" added to store successfully",
  "member": {
    "userId": 2,
    "user": {
      "UserID": 2,
      "Email": "staff@example.com",
      "FullName": "Staff User",
      "Phone": "0987654321"
    },
    "role": {
      "RoleID": 2,
      "RoleName": "Nhân viên",
      "Description": "Vai trò nhân viên bán hàng/kho"
    },
    "joinedAt": "2026-01-07T10:00:00.000Z"
  }
}
```

**3. Cập nhật Role của Member:**
```http
PUT /stores/members/2/role
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Body:
{
  "roleId": 3
}

Response (200):
{
  "message": "User role updated from \"Nhân viên\" to \"Kế toán kho\"",
  "member": {
    "userId": 2,
    "user": {
      "UserID": 2,
      "Email": "staff@example.com",
      "FullName": "Staff User"
    },
    "role": {
      "RoleID": 3,
      "RoleName": "Kế toán kho",
      "Description": "Quản lý kho hàng và báo cáo tài chính"
    },
    "updatedAt": "2026-01-07T11:00:00.000Z"
  }
}
```

**4. Xóa Member khỏi Store:**
```http
DELETE /stores/members/2
Headers:
  Authorization: Bearer <token>
  x-store-id: 1

Response (200):
{
  "message": "User \"staff@example.com\" removed from store successfully"
}
```

**Lưu ý:**
- User phải đăng ký (register) trước khi được thêm vào store
- Không thể thêm user đã là member của store
- Role phải thuộc store hiện tại
- Khi xóa member, chỉ xóa liên kết StoreUser, không xóa User account

---

## Security Features

Tất cả APIs đều được bảo vệ bởi:

### 1. JWT Authentication
- Bắt buộc có JWT token hợp lệ
- Token lấy từ endpoint `/auth/login`

### 2. Permission-based Authorization
- Mỗi endpoint yêu cầu permission cụ thể
- Được kiểm tra qua `@CheckPermission(action, subject)` decorator

### 3. Multi-tenant Isolation
- Bắt buộc có header `x-store-id` hoặc `x-subdomain`
- User chỉ thao tác trên store mà họ thuộc về
- Sử dụng `@CurrentStore()` decorator để lấy storeId

---

## Practices Implemented

### 1. DTOs với Validation
- `class-validator` decorators trên tất cả DTOs
- Swagger `@ApiProperty` với examples

### 2. Service Layer Pattern
- Business logic tách riêng khỏi Controllers
- Reusable services với exports

### 3. Error Handling
- Custom exceptions với messages rõ ràng
- Proper HTTP status codes

### 4. Security
- Permission-based access control
- Multi-tenant data isolation
- JWT token validation

### 5. Database Transactions
- Sử dụng Prisma ORM
- Include relations khi cần thiết
- Optimized queries

---
