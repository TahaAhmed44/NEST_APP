import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import type { UserDocument } from 'src/DB';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CategoryParamsDto,
  GetAllDto,
  UpdateCategoryDto,
} from './dto/update-category.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudFileUpload, multerValidation } from 'src/common/utils/multer';
import { Auth, IResponse, successResponse, User } from 'src/common';
import { CategoryResponse, GetAllResponse } from './entities/category.entity';
import { endPoint } from './category.authorization';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudFileUpload({ validation: multerValidation.image }),
    ),
  )
  @Auth(endPoint.create)
  @Post()
  async create(
    @User() user: UserDocument,
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this.categoryService.create(
      createCategoryDto,
      user,
      file,
    );

    return successResponse<CategoryResponse>({
      message: 'Done',
      status: 201,
      data: { category },
    });
  }

  @Auth(endPoint.create)
  @Patch(':categoryId')
  async update(
    @Param() params: CategoryParamsDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: UserDocument,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this.categoryService.update(
      params.categoryId,
      updateCategoryDto,
      user,
    );
    return successResponse<CategoryResponse>({ data: { category } });
  }

  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudFileUpload({ validation: multerValidation.image }),
    ),
  )
  @Auth(endPoint.create)
  @Patch(':categoryId/attachment')
  async updateAttachment(
    @Param() params: CategoryParamsDto,
    @UploadedFile(ParseFilePipe) file: Express.Multer.File,
    @User() user: UserDocument,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this.categoryService.updateAttachment(
      params.categoryId,
      file,
      user,
    );
    return successResponse<CategoryResponse>({ data: { category } });
  }

  @Auth(endPoint.create)
  @Patch(':categoryId/freeze')
  async freeze(
    @User() user: UserDocument,
    @Param() Params: CategoryParamsDto,
  ): Promise<IResponse> {
    await this.categoryService.freeze(Params.categoryId, user);
    return successResponse();
  }

  @Auth(endPoint.create)
  @Patch(':categoryId/restore')
  async restore(
    @User() user: UserDocument,
    @Param() Params: CategoryParamsDto,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this.categoryService.restore(
      Params.categoryId,
      user,
    );
    return successResponse<CategoryResponse>({ data: { category } });
  }

  @Auth(endPoint.create)
  @Delete(':categoryId/delete')
  async remove(
    @Param() params: CategoryParamsDto,
    @User() user: UserDocument,
  ): Promise<IResponse> {
    await this.categoryService.remove(params.categoryId, user);
    return successResponse();
  }

  @Get()
  async findAll(@Query() query: GetAllDto): Promise<IResponse<GetAllResponse>> {
    const result = await this.categoryService.findAll(query);
    return successResponse<GetAllResponse>({ data: { result } });
  }

  @Auth(endPoint.create)
  @Get('/archive')
  async findAllArchives(
    @Query() query: GetAllDto,
  ): Promise<IResponse<GetAllResponse>> {
    const result = await this.categoryService.findAll(query, true);
    return successResponse<GetAllResponse>({ data: { result } });
  }

  @Get(':categoryId')
  async findOne(
    @Param() params: CategoryParamsDto,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this.categoryService.findOne(params.categoryId);
    return successResponse<CategoryResponse>({ data: { category } });
  }

  @Auth(endPoint.create)
  @Get(':categoryId/archive')
  async findOneArchive(
    @Param() params: CategoryParamsDto,
  ): Promise<IResponse<CategoryResponse>> {
    const category = await this.categoryService.findOne(
      params.categoryId,
      true,
    );
    return successResponse<CategoryResponse>({ data: { category } });
  }
}
