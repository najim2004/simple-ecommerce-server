import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';

export interface JwtPayload {
  id: number;
  role: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<{ message: string }> {
    const { email, password, name } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await this.prisma.oTP.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: expiry,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, otp);

    return {
      message: 'User created successfully. Please check your email for OTP.',
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { id: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }

  async resendOtp(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    await this.prisma.oTP.deleteMany({ where: { userId: user.id } });

    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await this.prisma.oTP.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: expiry,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, otp);

    return { message: 'OTP has been resent to your email.' };
  }
}
