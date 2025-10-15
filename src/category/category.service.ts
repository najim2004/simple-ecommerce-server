import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private prisma: PrismaService) {}

  async create(createCategoryDto: CreateCategoryDto) {
    try {
      this.logger.log(`Creating category: ${createCategoryDto.name}`);
      return this.prisma.category.create({ data: createCategoryDto });
    } catch (error) {
      this.logger.error(
        `Failed to create category: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not create category.');
    }
  }

  async findAll() {
    try {
      this.logger.log('Finding all categories');
      return this.prisma.category.findMany();
    } catch (error) {
      this.logger.error(
        `Failed to find all categories: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not find all categories.');
    }
  }

  async findOne(id: string) {
    try {
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return category;
    } catch (error) {
      this.logger.error(`Failed to find category: ${(error as Error).message}`);
      throw new BadRequestException('Could not find category.');
    }
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    try {
      this.logger.log(`Updating category with ID: ${id}`);
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return this.prisma.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      this.logger.error(
        `Failed to update category: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not update category.');
    }
  }
  async remove(id: string) {
    try {
      this.logger.log(`Removing category with ID: ${id}`);
      const category = await this.prisma.category.findUnique({ where: { id } });
      if (!category) {
        throw new NotFoundException(`Category with ID ${id} not found`);
      }
      return this.prisma.category.delete({ where: { id } });
    } catch (error) {
      this.logger.error(
        `Failed to remove category: ${(error as Error).message}`,
      );
      throw new BadRequestException('Could not remove category.');
    }
  }
}
