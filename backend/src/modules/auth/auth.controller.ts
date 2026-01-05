import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        user: {
          UserID: 1,
          Email: 'user@example.com',
          FullName: 'John Doe',
          Phone: '0123456789',
          Address: '123 Main St',
          CreatedAt: '2026-01-05T10:00:00.000Z',
        },
        stores: [],
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async register(@Body() registerDto: RegisterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return await this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        user: {
          UserID: 1,
          Email: 'admin@app.com',
          FullName: 'Admin User',
          Phone: null,
          Address: null,
          CreatedAt: '2026-01-01T00:00:00.000Z',
        },
        stores: [
          {
            storeId: 1,
            storeName: 'Cửa hàng A',
            subdomain: 'test',
            roleId: 1,
            roleName: 'Chủ cửa hàng',
          },
        ],
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async login(@Body() loginDto: LoginDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return await this.authService.login(loginDto);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        UserID: 1,
        Email: 'admin@app.com',
        FullName: 'Admin User',
        Phone: null,
        Address: null,
        CreatedAt: '2026-01-01T00:00:00.000Z',
        stores: [
          {
            storeId: 1,
            storeName: 'Cửa hàng A',
            subdomain: 'test',
            roleId: 1,
            roleName: 'Chủ cửa hàng',
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  getProfile(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return req.user;
  }

  @Public()
  @Get('test')
  @ApiOperation({ summary: 'Test endpoint' })
  @ApiResponse({ status: 200, description: 'Test message' })
  test(): string {
    return this.authService.attemp();
  }
}
