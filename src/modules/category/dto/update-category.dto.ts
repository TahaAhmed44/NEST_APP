import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Validate,
} from 'class-validator';
import { Types } from 'mongoose';
import { containField, MongoDBIds } from 'src/common';
import { CreateCategoryDto } from './create-category.dto';
import { PartialType } from '@nestjs/mapped-types';

@containField()
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @Validate(MongoDBIds)
  @IsOptional()
  removeBrands?: Types.ObjectId[];
}

export class CategoryParamsDto {
  @IsMongoId()
  categoryId: Types.ObjectId;
}


