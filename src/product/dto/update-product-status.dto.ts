import { IsEnum, IsNotEmpty } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class UpdateProductStatusDto {
  @IsEnum(ProductStatus)
  @IsNotEmpty()
  status: ProductStatus;
}
