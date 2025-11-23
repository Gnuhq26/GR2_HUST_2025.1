import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, phone, address } = registerDto;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { Email: email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
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

    // Generate JWT token
    const token = this.generateToken(user.UserID, user.Email);

    return {
      user,
      access_token: token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await prisma.user.findUnique({
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

    // Generate JWT token
    const token = this.generateToken(user.UserID, user.Email);

    return {
      user: {
        UserID: user.UserID,
        Email: user.Email,
        FullName: user.FullName,
        Phone: user.Phone,
        Address: user.Address,
        CreatedAt: user.CreatedAt,
      },
      access_token: token,
    };
  }

  private generateToken(userId: number, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  async validateUser(userId: number) {
    return await prisma.user.findUnique({
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
