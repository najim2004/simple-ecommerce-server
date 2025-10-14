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
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, Role } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Req() req: { user: User },
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productService.create({
      ...createProductDto,
      sellerId: req.user.id,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: { user: User }) {
    return this.productService.findAll(req.user.role, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id/status')
  updateProductStatus(
    @Req() req: { user: User },
    @Param('id') productId: string,
    @Body() updateProductStatusDto: UpdateProductStatusDto,
  ) {
    return this.productService.updateProductStatus(
      productId,
      updateProductStatusDto.status,
      req.user.id,
    );
  }
}
