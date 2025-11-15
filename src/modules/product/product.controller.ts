import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ParseFilePipe,
  UsePipes,
  ValidationPipe,
  UploadedFiles,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductParamDto, UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload, multerValidation } from 'src/common/utils/multer';
import {
  Auth,
  GetAllDto,
  GetAllResponse,
  IProduct,
  IResponse,
  successResponse,
  User,
} from 'src/common';
import { endPoint } from './product.authorization';
import type { UserDocument } from 'src/DB';
import { ProductResponse } from './entities/product.entity';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5,
      cloudFileUpload({ validation: multerValidation.image }),
    ),
  )
  @Auth(endPoint.create)
  @Post()
  async create(
    @UploadedFiles(ParseFilePipe) files: Express.Multer.File[],
    @User() user: UserDocument,
    @Body() createProductDto: CreateProductDto,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.create(
      createProductDto,
      files,
      user,
    );
    return successResponse<ProductResponse>({ status: 201, data: { product } });
  }

  @Auth(endPoint.create)
  @Patch(':productId')
  async update(
    @Param() params: ProductParamDto,
    @Body() updateProductDto: UpdateProductDto,
    @User() user: UserDocument,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.update(
      params.productId,
      updateProductDto,
      user,
    );
    return successResponse<ProductResponse>({ data: { product } });
  }

  @UseInterceptors(
    FilesInterceptor(
      'attachments',
      5,
      cloudFileUpload({ validation: multerValidation.image }),
    ),
  )
  @Auth(endPoint.create)
  @Patch(':productId/attachments')
  async updateAttachment(
    @Param() params: ProductParamDto,
    @UploadedFiles(ParseFilePipe) files: Express.Multer.File[],
    @User() user: UserDocument,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.updateAttachments(
      params.productId,
      files,
      user,
    );
    return successResponse<ProductResponse>({ data: { product } });
  }

  @Auth(endPoint.create)
  @Patch(':productId/freeze')
  async freeze(
    @User() user: UserDocument,
    @Param() Params: ProductParamDto,
  ): Promise<IResponse> {
    await this.productService.freeze(Params.productId, user);
    return successResponse();
  }

  @Auth(endPoint.create)
  @Patch(':productId/restore')
  async restore(
    @User() user: UserDocument,
    @Param() Params: ProductParamDto,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.restore(Params.productId, user);
    return successResponse<ProductResponse>({ data: { product } });
  }

  @Auth(endPoint.create)
  @Delete(':productId/delete')
  async remove(
    @Param() params: ProductParamDto,
    @User() user: UserDocument,
  ): Promise<IResponse> {
    await this.productService.remove(params.productId, user);
    return successResponse();
  }

  @Get()
  async findAll(
    @Query() query: GetAllDto,
  ): Promise<IResponse<GetAllResponse<IProduct>>> {
    const result = await this.productService.findAll(query);
    return successResponse<GetAllResponse<IProduct>>({ data: { result } });
  }

  @Auth(endPoint.create)
  @Get('/archive')
  async findAllArchives(
    @Query() query: GetAllDto,
  ): Promise<IResponse<GetAllResponse<IProduct>>> {
    const result = await this.productService.findAll(query, true);
    return successResponse<GetAllResponse<IProduct>>({ data: { result } });
  }

  @Get(':productId')
  async findOne(
    @Param() params: ProductParamDto,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.findOne(params.productId);
    return successResponse<ProductResponse>({ data: { product } });
  }

  @Auth(endPoint.create)
  @Get(':productId/archive')
  async findOneArchive(
    @Param() params: ProductParamDto,
  ): Promise<IResponse<ProductResponse>> {
    const product = await this.productService.findOne(params.productId, true);
    return successResponse<ProductResponse>({ data: { product } });
  }
}
