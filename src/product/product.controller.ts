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
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User, Role, ProductStatus } from '@prisma/client';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';

import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
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
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Req() req: { user: User },
    @Query('sellerId') sellerId?: string,
    @Query('status') status?: ProductStatus,
    @Query('myProducts') myProducts?: boolean,
  ) {
    if (req.user) {
      if (req.user.role === Role.ADMIN) {
        return this.productService.findAll(
          req.user.role,
          sellerId,
          status,
          myProducts,
        );
      } else {
        return this.productService.findAll(
          req.user.role,
          req.user.id,
          status,
          myProducts,
        );
      }
    } else {
      return this.productService.findAll();
    }
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: { user: User }) {
    return this.productService.findOne(id, req.user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: { user: User },
  ) {
    return this.productService.update(id, updateProductDto, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SELLER)
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
