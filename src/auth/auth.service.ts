import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterUserDto } from './dto/register-user.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { OtpType } from './enums/otp-type.enum';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  id: number;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

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
    this.logger.log(`Attempting to register user: ${registerUserDto.email}`);
    const { email, password, name } = registerUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      this.logger.warn(
        `Registration failed: User with email ${email} already exists`,
      );
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

    this.logger.log(`User ${user.email} registered successfully. Sending OTP.`);

    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await this.prisma.oTP.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: expiry,
        type: OtpType.REGISTRATION,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, otp);

    return {
      message: 'User created successfully. Please check your email for OTP.',
    };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    this.logger.log(`Attempting to log in user: ${loginDto.email}`);
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Login failed: User ${email} not found`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.logger.warn(`Login failed: Invalid password for user ${email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { id: user.id, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    this.logger.log(`User ${email} logged in successfully.`);
    return { accessToken };
  }

  async resendOtp(email: string, type: OtpType): Promise<{ message: string }> {
    this.logger.log(
      `Attempting to resend OTP for user: ${email}, type: ${type}`,
    );
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`Resend OTP failed: User ${email} not found`);
      throw new NotFoundException(`User with email ${email} not found`);
    }

    await this.prisma.oTP.deleteMany({ where: { userId: user.id, type } });

    const otp = this.generateOtp();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await this.prisma.oTP.create({
      data: {
        userId: user.id,
        code: otp,
        expiresAt: expiry,
        type,
      },
    });

    await this.mailService.sendVerificationEmail(user.email, otp);

    this.logger.log(`OTP resent successfully for user: ${email}`);
    return { message: 'OTP has been resent to your email.' };
  }

  async verifyOtp(
    email: string,
    otp: string,
    type: OtpType,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Attempting to verify OTP for user: ${email}, type: ${type}`,
    );
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      this.logger.warn(`OTP verification failed: User ${email} not found`);
      throw new NotFoundException('User not found');
    }

    const storedOtp = await this.prisma.oTP.findFirst({
      where: { userId: user.id, code: otp, type, used: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!storedOtp) {
      this.logger.warn(
        `OTP verification failed: Invalid or expired OTP for user ${email}`,
      );
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (storedOtp.expiresAt < new Date()) {
      this.logger.warn(
        `OTP verification failed: OTP expired for user ${email}`,
      );
      throw new BadRequestException('OTP expired');
    }

    await this.prisma.oTP.update({
      where: { id: storedOtp.id },
      data: { used: true },
    });

    if (type === OtpType.REGISTRATION) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    this.logger.log(`OTP verified successfully for user: ${email}`);
    return { message: 'OTP verified successfully' };
  }
}
