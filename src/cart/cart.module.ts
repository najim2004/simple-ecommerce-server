import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
