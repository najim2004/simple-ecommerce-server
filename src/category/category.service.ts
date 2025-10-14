import { Injectable, Logger } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    this.logger.log(`Creating category: ${createCategoryDto.name}`);
    return this.prisma.category.create({ data: createCategoryDto });
  }

  async findAll() {
    this.logger.log('Finding all categories');
    return this.prisma.category.findMany();
  }

  async findOne(id: string) {
    this.logger.log(`Finding category with ID: ${id}`);
    return this.prisma.category.findUnique({ where: { id } });
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    this.logger.log(`Updating category with ID: ${id}`);
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }
  async remove(id: string) {
    this.logger.log(`Removing category with ID: ${id}`);
    return this.prisma.category.delete({ where: { id } });
  }
}
