import { Injectable, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);

  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto & { sellerId: number }) {
    this.logger.log(`Creating product: ${createProductDto.name} by seller ${createProductDto.sellerId}`);
    return this.prisma.product.create({ data: createProductDto });
  }

  async findAll() {
    this.logger.log('Finding all products');
    return this.prisma.product.findMany({
      include: { category: true, seller: true },
    });
  }

  async findOne(id: number) {
    this.logger.log(`Finding product with ID: ${id}`);
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true, seller: true },
    });
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    this.logger.log(`Updating product with ID: ${id}`);
    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
    });
  }

  async remove(id: number) {
    this.logger.log(`Removing product with ID: ${id}`);
    return this.prisma.product.delete({ where: { id } });
  }
}
