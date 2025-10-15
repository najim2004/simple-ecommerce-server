import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'prisma/prisma.service';
import { ProductStatus, Role, Prisma, User } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto & { sellerId: string }) {
    try {
      this.logger.log(
        `Creating product: ${createProductDto.name} by seller ${createProductDto.sellerId}`,
      );
      return this.prisma.product.create({ data: createProductDto });
    } catch (error) {
      this.logger.error(
        `Failed to create product: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not create product.');
    }
  }

  async findAll(
    userRole?: Role,
    sellerId?: string,
    status?: ProductStatus,
    myProducts?: boolean,
  ) {
    try {
      this.logger.log('Finding all products');
      const where: Prisma.ProductWhereInput = {};

      if (myProducts && userRole === Role.SELLER) {
        where.sellerId = sellerId;
      } else if (userRole === Role.ADMIN) {
        if (sellerId) {
          where.sellerId = sellerId;
        }
        if (status) {
          where.status = status;
        }
      } else {
        where.status = ProductStatus.APPROVED;
      }

      return this.prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to find all products: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not find all products.');
    }
  }

  async findOne(id: string, user?: User) {
    try {
      this.logger.log(`Finding product with ID: ${id}`);
      const product = await this.prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          seller: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      if (user) {
        if (user.role === Role.ADMIN || product.sellerId === user.id) {
          return product;
        }
      }

      if (product.status !== ProductStatus.APPROVED) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      return product;
    } catch (error) {
      this.logger.error(`Failed to find product: ${(error as Error).message}`);
      throw new BadRequestException('Could not find product.');
    }
  }

  async update(id: string, updateProductDto: UpdateProductDto, user: User) {
    try {
      this.logger.log(`Updating product with ID: ${id}`);
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

      if (user.role !== Role.ADMIN && product.sellerId !== user.id) {
        throw new ForbiddenException(
          'You are not authorized to update this product',
        );
      }

      if (updateProductDto.status) {
        if (user.role !== Role.ADMIN) {
          if (
            updateProductDto.status !== ProductStatus.DRAFT &&
            updateProductDto.status !== ProductStatus.PENDING
          ) {
            throw new ForbiddenException(
              'You are only allowed to update the status to DRAFT or PENDING',
            );
          }
        }
      }

      return this.prisma.product.update({
        where: { id },
        data: updateProductDto,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update product: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not update product.');
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Removing product with ID: ${id}`);
      const product = await this.prisma.product.findUnique({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }
      return this.prisma.product.delete({ where: { id } });
    } catch (error) {
      this.logger.error(
        `Failed to remove product: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not remove product.');
    }
  }

  async updateProductStatus(
    productId: string,
    newStatus: ProductStatus,
    adminId: string,
  ) {
    try {
      this.logger.log(
        `Admin ${adminId} attempting to update status of product ${productId} to ${newStatus}`,
      );

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        this.logger.error(
          `Product with ID ${productId} not found for status update`,
        );
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      if (
        newStatus === ProductStatus.APPROVED &&
        product.status !== ProductStatus.PENDING
      ) {
        this.logger.warn(
          `Product ${productId} cannot be APPROVED from status ${product.status}`,
        );
        throw new BadRequestException(
          `Product cannot be APPROVED from its current status: ${product.status}`,
        );
      }
      if (
        newStatus === ProductStatus.REJECTED &&
        product.status !== ProductStatus.PENDING
      ) {
        this.logger.warn(
          `Product ${productId} cannot be REJECTED from status ${product.status}`,
        );
        throw new BadRequestException(
          `Product cannot be REJECTED from its current status: ${product.status}`,
        );
      }
      if (
        newStatus === ProductStatus.PENDING &&
        product.status !== ProductStatus.DRAFT
      ) {
        this.logger.warn(
          `Product ${productId} cannot be set to PENDING from status ${product.status}`,
        );
        throw new BadRequestException(
          `Product cannot be set to PENDING from its current status: ${product.status}`,
        );
      }

      return this.prisma.product.update({
        where: { id: productId },
        data: { status: newStatus },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update product status: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not update product status.');
    }
  }
}
