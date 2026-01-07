# Changelog - Multi-Tenant Authentication & Authorization System

**Date**: January 5, 2026  
**Branch**: hungdz  
**Developer**: Gnuhq26

---

## 📋 Overview

Hoàn thiện hệ thống **Authentication & Authorization** với **Multi-tenant RBAC** (Role-Based Access Control) cho ứng dụng quản lý cửa hàng.

### 🎯 Objectives Completed

1. ✅ Authentication với JWT (Login/Register)
2. ✅ JWT Token chứa thông tin Stores & Roles của User
3. ✅ Global JWT Guard cho toàn bộ application
4. ✅ Multi-tenant context (x-store-id, x-subdomain headers)
5. ✅ Permission Guard với RBAC
6. ✅ Custom Decorators (@Public, @CurrentStore, @CheckPermission)
7. ✅ Swagger API Documentation
8. ✅ TypeScript Type Definitions cho Express Request

---

## 🚀 Major Features Implemented

### 1. **Enhanced Authentication System**

#### JWT Payload Structure
```typescript
{
  sub: number,           // User ID
  email: string,         // User email
  stores: [              // Tất cả stores mà user tham gia
    {
      storeId: number,
      storeName: string,
      subdomain: string,
      roleId: number,
      roleName: string
    }
  ]
}
```

**Benefits:**
- Không cần query database mỗi lần check authorization
- User biết mình thuộc stores nào ngay khi login
- Token chứa đầy đủ context cho multi-tenant operations

---

### 2. **Global JWT Guard**

**File**: `src/common/guards/global-jwt-auth.guard.ts`

Tự động bảo vệ **tất cả routes** trừ những route được đánh dấu `@Public()`.

**Before** (Manual guard mỗi route):
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile() { }
```

**After** (Auto-protected):
```typescript
@Get('profile')           // Tự động protected
getProfile() { }

@Public()                 // Chỉ cần mark public
@Post('login')
login() { }
```

---

### 3. **Permission Guard (RBAC)**

**File**: `src/common/guards/permission.guard.ts`

Kiểm tra quyền dựa trên Role của User tại Store hiện tại.

**Logic Flow:**
1. Lấy `x-store-id` hoặc `x-subdomain` từ headers
2. Verify user có thuộc store đó không
3. Lấy RoleID của user tại store
4. Check Role có permission `(action, subject)` trong database
5. Ưu tiên check `manage all` (Super Admin) trước

**Usage Example:**
```typescript
// Chỉ user có quyền "create Product" mới access được
@CheckPermission('create', 'Product')
@Post('products')
createProduct() { }

// Super Admin only
@CheckPermission('manage', 'all')
@Delete('stores/:id')
deleteStore() { }
```

---

### 4. **Custom Decorators**

#### a) `@Public()`
**File**: `src/common/decorators/public.decorator.ts`

Đánh dấu routes không cần authentication.

```typescript
@Public()
@Post('login')
login() { }
```

#### b) `@CurrentStore()`
**File**: `src/common/decorators/current-store.decorator.ts`

Extract store information từ request headers.

**3 Modes:**
```typescript
// Mode 1: Get Store ID (default)
@Get('products')
getProducts(@CurrentStore() storeId: number) { }

// Mode 2: Get Store ID explicitly
@Get('orders')
getOrders(@CurrentStore('id') storeId: number) { }

// Mode 3: Get Full Store Info
@Get('dashboard')
getDashboard(@CurrentStore('full') store: StoreInfo) {
  // store = { storeId, storeName, subdomain, roleId, roleName }
}
```

**Headers Support:**
- `x-store-id: 1` (Priority 1)
- `x-subdomain: test` (Priority 2)
- Fallback to first store in user's stores array

#### c) `@CheckPermission(action, subject)`
**File**: `src/common/decorators/check-permission.decorator.ts`

Metadata decorator cho Permission Guard.

```typescript
@CheckPermission('read', 'Order')
@Get('orders')
getOrders() { }
```

---

### 5. **Swagger API Documentation**

**File**: `src/main.ts`

**Features:**
- ✅ Bearer JWT Authentication với button "Authorize"
- ✅ Multi-tenant headers (x-store-id, x-subdomain)
- ✅ Request/Response schemas với examples
- ✅ API grouping với @ApiTags
- ✅ Try it out functionality

**Access URL**: `http://localhost:3000/api`

**How to Test:**
1. POST `/auth/login` với `admin@app.com` / `123456`
2. Copy `access_token` từ response
3. Click **"Authorize"** button (góc phải)
4. Paste token và click "Authorize"
5. Test protected endpoints với JWT auto-included

---

### 6. **TypeScript Type Definitions**

**File**: `src/types/express.d.ts`

Extend Express Request interface để support custom properties.

```typescript
interface Request {
  currentStore?: StoreInfo;    // Set by PermissionGuard
  user?: {                     // Set by JWT Strategy
    UserID: number;
    Email: string;
    FullName: string | null;
    stores?: Array<StoreInfo>;
  };
}
```

**Fixes**: TypeScript errors khi access `req.user` và `req.currentStore`

---

## 📁 File Changes Detail

### Modified Files

#### 1. **package.json & package-lock.json**
```json
{
  "dependencies": {
    "@nestjs/swagger": "^x.x.x"  // NEW
  },
  "devDependencies": {
    "@types/passport-jwt": "^x.x.x"  // NEW
  }
}
```

#### 2. **src/app.module.ts**
```typescript
// ADDED: Global JWT Guard
providers: [
  AppService,
  {
    provide: APP_GUARD,
    useClass: GlobalJwtAuthGuard,  // NEW
  },
]
```

#### 3. **src/main.ts**
```typescript
// ADDED: Swagger Configuration
const config = new DocumentBuilder()
  .setTitle('Multi-Tenant API')
  .addBearerAuth(...)
  .addApiKey({ name: 'x-store-id' }, 'store-id')
  .addApiKey({ name: 'x-subdomain' }, 'subdomain')
  .build();

SwaggerModule.setup('api', app, document);
```

#### 4. **src/modules/auth/auth.service.ts**

**ADDED Methods:**
```typescript
// Validate user credentials (was missing proper implementation)
async validateUser(email: string, password: string)

// Get all stores user belongs to
private async getUserStores(userId: number)

// Get user by ID
async getUserById(userId: number)
```

**MODIFIED Methods:**
```typescript
// Now includes stores in JWT payload
private generateToken(userId, email, stores)

// Returns stores information
async login(loginDto)
async register(registerDto)
```

**ADDED Interface:**
```typescript
export interface JwtPayload {
  sub: number;
  email: string;
  stores: Array<StoreInfo>;
}
```

#### 5. **src/modules/auth/auth.controller.ts**

**ADDED Decorators:**
```typescript
@ApiTags('Authentication')
@ApiOperation({ summary: '...' })
@ApiResponse({ status: 200, schema: {...} })
@ApiBearerAuth('JWT-auth')
@Public()
```

**REMOVED:**
```typescript
@UseGuards(JwtAuthGuard)  // No longer needed (Global guard)
```

#### 6. **src/modules/auth/auth.module.ts**

**MODIFIED:**
```typescript
signOptions: { expiresIn: '1d' }  // Changed from '7d'
```

#### 7. **src/modules/auth/strategies/jwt.strategy.ts**

**MODIFIED:**
```typescript
// Import JwtPayload from auth.service
import { JwtPayload } from '../auth.service';

// Return user with stores from JWT
async validate(payload: JwtPayload) {
  return {
    ...user,
    stores: payload.stores,  // NEW
  };
}
```

#### 8. **src/modules/auth/dto/login.dto.ts**
```typescript
// ADDED: Swagger decorators
@ApiProperty({
  example: 'admin@app.com',
  description: 'User email address',
})
```

#### 9. **src/modules/auth/dto/register.dto.ts**
```typescript
// ADDED: Swagger decorators
@ApiProperty({ example: '...', description: '...' })
@ApiPropertyOptional({ ... })
```

#### 10. **tsconfig.json**
```typescript
// ADDED:
"typeRoots": ["./node_modules/@types", "./src/types"]
```

---

### New Files Created

#### 1. **backend/prisma/core-erd.dbml**
DBML file for generating ERD diagram at https://dbdiagram.io/

#### 2. **src/common/decorators/**
```
├── public.decorator.ts           // @Public()
├── current-store.decorator.ts    // @CurrentStore()
├── check-permission.decorator.ts // @CheckPermission()
└── index.ts                      // Export all
```

#### 3. **src/common/guards/**
```
├── global-jwt-auth.guard.ts     // Global JWT protection
├── permission.guard.ts          // RBAC permission check
└── index.ts                     // Export all
```

#### 4. **src/common/index.ts**
Central export file for common utilities

#### 5. **src/types/express.d.ts**
TypeScript definitions for Express Request extensions

---

## 🧪 Testing Guide

### 1. Start Server
```bash
cd backend
npm run start:dev
```

### 2. Access Swagger
```
http://localhost:3000/api
```

### 3. Test Authentication

#### Login (Public)
```bash
POST /auth/login
{
  "email": "admin@app.com",
  "password": "123456"
}

Response:
{
  "user": { ... },
  "stores": [
    {
      "storeId": 1,
      "storeName": "Cửa hàng A",
      "subdomain": "test",
      "roleId": 1,
      "roleName": "Chủ cửa hàng"
    }
  ],
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Profile (Protected)
```bash
GET /auth/profile
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
{
  "UserID": 1,
  "Email": "admin@app.com",
  "FullName": "Admin User",
  "stores": [...]
}
```

### 4. Test Multi-Tenant Context

```bash
GET /some-protected-route
Headers:
  Authorization: Bearer <token>
  x-store-id: 1              # Specify which store context
  # OR
  x-subdomain: test          # Alternative way
```

### 5. Test Permission Guard

Create a test endpoint:
```typescript
@CheckPermission('create', 'Product')
@Post('test/product')
testCreateProduct(@CurrentStore('full') store: StoreInfo) {
  return { message: 'Access granted', store };
}
```

**Test Cases:**
- ✅ Admin User (has 'manage all') → Access granted
- ✅ User with 'create Product' → Access granted
- ❌ User without permission → 403 Forbidden
- ❌ User not in store → 403 Forbidden
- ❌ Missing x-store-id header → 403 Forbidden

---

## 🔒 Security Features

1. **JWT Token Expiration**: 1 day (configurable)
2. **Password Hashing**: bcrypt with salt rounds = 10
3. **Global Authentication**: All routes protected by default
4. **Multi-tenant Isolation**: Users can only access stores they belong to
5. **Fine-grained Permissions**: Action-Subject based RBAC
6. **Super Admin Support**: 'manage all' permission bypasses all checks

---

## 🎨 Best Practices Applied

1. ✅ **Separation of Concerns**: Decorators, Guards, Services properly separated
2. ✅ **DRY Principle**: Reusable decorators and guards
3. ✅ **Type Safety**: Full TypeScript coverage with interfaces
4. ✅ **API Documentation**: Swagger with examples
5. ✅ **Error Handling**: Proper HTTP status codes and messages
6. ✅ **Security First**: Authentication/Authorization baked into architecture
7. ✅ **Developer Experience**: Easy-to-use decorators and clear error messages

---

## 📊 Architecture Overview

```
Request Flow:
1. Client → Request with JWT Token
2. GlobalJwtAuthGuard → Verify JWT (unless @Public)
3. JwtStrategy → Decode token, attach user to request
4. PermissionGuard → Check permissions (if @CheckPermission)
5. Controller → Access req.user and @CurrentStore()
6. Response ← Send data
```

---

## 🚧 Next Steps (Recommendations)

### Short Term
1. Create Product module with CRUD operations
2. Create Order module
3. Add Role management endpoints
4. Add Permission management endpoints
5. Implement refresh token mechanism

### Medium Term
1. Add rate limiting
2. Implement audit logs
3. Add WebSocket support for real-time updates
4. Create admin dashboard endpoints
5. Add data export/import features

### Long Term
1. Implement caching (Redis)
2. Add microservices architecture
3. Implement event sourcing
4. Add monitoring and alerting
5. Create mobile API endpoints

---

## 📝 Database Schema Reference

Core tables:
- **Users**: User accounts
- **Stores**: Tenant/Store entities
- **Roles**: Roles within each store
- **Permissions**: Available permissions (Action + Subject)
- **RolePermission**: Role-Permission mapping
- **StoreUser**: User-Store-Role relationships

**ERD Diagram**: Available in `backend/prisma/core-erd.dbml`

---

## 🐛 Known Issues

None currently.

---

## 👥 Contributors

- Gnuhq26 (Developer)

---

## 📚 References

- NestJS Documentation: https://docs.nestjs.com
- Passport JWT: https://www.passportjs.org/packages/passport-jwt/
- Swagger/OpenAPI: https://swagger.io/specification/
- Prisma ORM: https://www.prisma.io/docs

---

**End of Changelog**
