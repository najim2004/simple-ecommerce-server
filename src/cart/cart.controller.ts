import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: { user: User }) {
    return this.cartService.getCart(req.user.id);
  }

  @Post()
  addToCart(@Req() req: { user: User }, @Body() addToCartDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, addToCartDto);
  }

  @Patch(':productId')
  updateCartItem(
    @Req() req: { user: User },
    @Param('productId') productId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      req.user.id,
      +productId,
      updateCartItemDto,
    );
  }

  @Delete(':productId')
  removeCartItem(
    @Req() req: { user: User },
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeCartItem(req.user.id, +productId);
  }

  @Delete()
  clearCart(@Req() req: { user: User }) {
    return this.cartService.clearCart(req.user.id);
  }
}
