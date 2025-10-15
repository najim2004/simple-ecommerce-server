import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    this.logger.log(`Getting cart for user ID: ${userId}`);
    return this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    this.logger.log(
      `User ${userId} adding product ${addToCartDto.productId} to cart`,
    );
    try {
      const { productId, quantity } = addToCartDto;

      let cart = await this.prisma.cart.findUnique({ where: { userId } });

      if (!cart) {
        this.logger.log(`Creating new cart for user ID: ${userId}`);
        cart = await this.prisma.cart.create({ data: { userId } });
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        this.logger.error(
          `Product with ID ${productId} not found when adding to cart for user ${userId}`,
        );
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const existingCartItem = await this.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      if (existingCartItem) {
        this.logger.log(
          `Updating quantity for existing cart item (product ${productId}) for user ${userId}`,
        );
        return this.prisma.cartItem.update({
          where: { cartId_productId: { cartId: cart.id, productId } },
          data: { quantity: existingCartItem.quantity + quantity },
        });
      } else {
        this.logger.log(
          `Adding new cart item (product ${productId}) for user ${userId}`,
        );
        return this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
            unitPrice: product.price,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to add to cart: ${(error as Error).message}`);
      throw new BadRequestException('Could not add to cart.');
    }
  }

  async updateCartItem(
    userId: string,
    productId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    this.logger.log(
      `User ${userId} updating cart item for product ${productId}`,
    );
    try {
      const { quantity } = updateCartItemDto;

      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        this.logger.error(
          `Cart not found for user ${userId} when updating item`,
        );
        throw new NotFoundException('Cart not found');
      }

      const existingCartItem = await this.prisma.cartItem.findUnique({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });

      if (!existingCartItem) {
        this.logger.error(
          `Product with ID ${productId} not found in cart for user ${userId} when updating`,
        );
        throw new NotFoundException(
          `Product with ID ${productId} not found in cart`,
        );
      }

      if (quantity <= 0) {
        this.logger.log(
          `Removing cart item (product ${productId}) for user ${userId} due to quantity <= 0`,
        );
        return this.prisma.cartItem.delete({
          where: { cartId_productId: { cartId: cart.id, productId } },
        });
      } else {
        return this.prisma.cartItem.update({
          where: { cartId_productId: { cartId: cart.id, productId } },
          data: { quantity },
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to update cart item: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not update cart item.');
    }
  }

  async removeCartItem(userId: string, productId: string) {
    this.logger.log(
      `User ${userId} removing cart item for product ${productId}`,
    );
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        this.logger.error(
          `Cart not found for user ${userId} when removing item`,
        );
        throw new NotFoundException('Cart not found');
      }

      return this.prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to remove cart item: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not remove cart item.');
    }
  }

  async clearCart(userId: string) {
    this.logger.log(`Clearing cart for user ID: ${userId}`);
    try {
      const cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        this.logger.error(
          `Cart not found for user ${userId} when clearing cart`,
        );
        throw new NotFoundException('Cart not found');
      }

      return this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } catch (error) {
      this.logger.error(`Failed to clear cart: ${(error as Error).message}`);
      throw new BadRequestException('Could not clear cart.');
    }
  }
}
