import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ProposePriceDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;
}
