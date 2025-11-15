import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { Types } from 'mongoose';
import { IsMongoId } from 'class-validator';
import { containField } from 'src/common';

@containField()
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ProductParamDto {
  @IsMongoId()
  productId: Types.ObjectId;
}
