import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';
import { OtpType } from '../enums/otp-type.enum';

export class ResendOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(OtpType)
  @IsNotEmpty()
  type: OtpType;
}
