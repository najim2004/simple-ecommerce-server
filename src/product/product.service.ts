import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'prisma/prisma.service';
import { ProductStatus, Role, Prisma } from '@prisma/client';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto & { sellerId: string }) {
    this.logger.log(
      `Creating product: ${createProductDto.name} by seller ${createProductDto.sellerId}`,
    );
    return this.prisma.product.create({ data: createProductDto });
  }

  async findAll(userRole?: Role, sellerId?: string) {
    this.logger.log('Finding all products');
    const where: Prisma.ProductWhereInput = {};

    if (userRole === Role.BUYER) {
      where.status = ProductStatus.APPROVED;
    } else if (userRole === Role.SELLER && sellerId) {
      where.sellerId = sellerId;
    }

    return this.prisma.product.findMany({
      where,
      include: { category: true, seller: true },
    });
  }

  async findOne(id: string) {
    this.logger.log(`Finding product with ID: ${id}`);
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true, seller: true },
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    this.logger.log(`Updating product with ID: ${id}`);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    this.logger.log(`Removing product with ID: ${id}`);
    return this.prisma.product.delete({ where: { id } });
  }

  async updateProductStatus(
    productId: string,
    newStatus: ProductStatus,
    adminId: string,
  ) {
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
  }
}
