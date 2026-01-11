import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto';

export interface JwtPayload {
  sub: number;
  email: string;
  stores: Array<{
    storeId: number;
    storeName: string;
    subdomain: string;
    roleId: number;
    roleName: string;
  }>;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, phone, address } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { Email: email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        Email: email,
        PasswordHash: hashedPassword,
        FullName: fullName,
        Phone: phone,
        Address: address,
      },
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        CreatedAt: true,
      },
    });

    // Get user stores and roles
    const stores = await this.getUserStores(user.UserID);

    // Generate JWT token
    const token = this.generateToken(user.UserID, user.Email, stores);

    return {
      user,
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Validate user credentials
    const user = await this.validateUser(email, password);

    // Get user stores and roles
    const stores = await this.getUserStores(user.UserID);

    // Generate JWT token
    const token = this.generateToken(user.UserID, user.Email, stores);

    return {
      user: {
        UserID: user.UserID,
        Email: user.Email,
        FullName: user.FullName,
        Phone: user.Phone,
        Address: user.Address,
        CreatedAt: user.CreatedAt,
      },
      stores,
      access_token: token,
    };
  }

  /**
   * Validate user credentials (email and password)
   * @param email User email
   * @param password User password (plain text)
   * @returns User object if valid
   * @throws UnauthorizedException if invalid
   */
  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { Email: email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  /**
   * Get all stores that user belongs to with their roles
   * @param userId User ID
   * @returns Array of stores with role information
   */
  private async getUserStores(userId: number) {
    const storeUsers = await this.prisma.storeUser.findMany({
      where: { UserID: userId },
      include: {
        store: {
          select: {
            StoreID: true,
            StoreName: true,
            Subdomain: true,
          },
        },
        role: {
          select: {
            RoleID: true,
            RoleName: true,
          },
        },
      },
    });

    return storeUsers.map((su) => ({
      storeId: su.store.StoreID,
      storeName: su.store.StoreName,
      subdomain: su.store.Subdomain,
      roleId: su.role.RoleID,
      roleName: su.role.RoleName,
    }));
  }

  /**
   * Generate JWT token with user info and stores
   */
  private generateToken(
    userId: number,
    email: string,
    stores: Array<{
      storeId: number;
      storeName: string;
      subdomain: string;
      roleId: number;
      roleName: string;
    }>,
  ): string {
    const payload: JwtPayload = { sub: userId, email, stores };
    return this.jwtService.sign(payload);
  }

  /**
   * Get user by ID with store information
   */
  async getUserById(userId: number) {
    return await this.prisma.user.findUnique({
      where: { UserID: userId },
      select: {
        UserID: true,
        Email: true,
        FullName: true,
        Phone: true,
        Address: true,
        CreatedAt: true,
      },
    });
  }

  attemp(): string {
    return 'Hello, i am Gnuhq26!';
  }
}
