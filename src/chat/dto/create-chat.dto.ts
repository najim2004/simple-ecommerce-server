import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateChatDto {
  @IsNumber()
  @IsNotEmpty()
  productId: number;

  @IsNumber()
  @IsNotEmpty()
  sellerId: number;
}
