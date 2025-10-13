import { IsEmail, IsNotEmpty, IsString, Length, IsEnum } from 'class-validator';
import { OtpType } from '../enums/otp-type.enum';

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be a 6-digit string' })
  otp: string;

  @IsEnum(OtpType)
  @IsNotEmpty()
  type: OtpType;
}
