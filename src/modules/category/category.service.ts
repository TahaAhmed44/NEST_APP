import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { GetAllDto, UpdateCategoryDto } from './dto/update-category.dto';
import {
  BrandRepository,
  CategoryDocument,
  CategoryRepository,
  UserDocument,
} from 'src/DB';
import { FolderEnum, S3Service } from 'src/common';
import { Types } from 'mongoose';
import { Lean } from 'src/DB/repository/database.repository';
import { randomUUID } from 'node:crypto';

@Injectable()
export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createCategoryDto: CreateCategoryDto,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<CategoryDocument> {
    const { name } = createCategoryDto;
    const checkDuplicated = await this.categoryRepository.findOne({
      filter: { name, paranoid: false },
    });

    if (checkDuplicated) {
      throw new ConflictException(
        checkDuplicated.freezedAt
          ? 'Duplicated with archived Category'
          : 'Duplicated Category name.',
      );
    }

    const brands: Types.ObjectId[] = [
      ...new Set(createCategoryDto.brands || []),
    ];
    if (
      brands &&
      (await this.brandRepository.find({ filter: { _id: { $in: brands } } }))
        .length != brands.length
    ) {
      throw new NotFoundException('Some of the mentioned brands are not exist');
    }

    let assetFolderId: string = randomUUID();
    const image: string = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.Category}/${assetFolderId}`,
    });

    const [category] = await this.categoryRepository.create({
      data: [
        {
          ...createCategoryDto,
          assetFolderId,
          createdBy: user._id,
          image,
          brands: brands.map((brand) => {
            return Types.ObjectId.createFromHexString(
              brand as unknown as string,
            );
          }),
        },
      ],
    });
    if (!category) {
      await this.s3Service.deleteFile({ Key: image });
      throw new BadRequestException('Fail to create this Category resource');
    }

    return category;
  }

  async update(
    categoryId: Types.ObjectId,
    updateCategoryDto: UpdateCategoryDto,
    user: UserDocument,
  ): Promise<CategoryDocument | Lean<CategoryDocument>> {
    if (
      updateCategoryDto.name &&
      (await this.categoryRepository.findOne({
        filter: { name: updateCategoryDto.name },
      }))
    ) {
      throw new ConflictException('Duplicated Category name.');
    }

    const brands: Types.ObjectId[] = [
      ...new Set(updateCategoryDto.brands || []),
    ];
    if (
      brands &&
      (
        await this.brandRepository.find({
          filter: { _id: { $in: brands } },
        })
      ).length != brands.length
    ) {
      throw new NotFoundException('Some of the mentioned brands are not exist');
    }

    const removeBrands = updateCategoryDto.removeBrands ?? [];
    delete updateCategoryDto.removeBrands;

    const updatedCategory = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: [
        {
          $set: {
            ...updateCategoryDto,
            updatedBy: user._id,
            brands: {
              $setUnion: [
                {
                  $setDifference: [
                    '$brands',
                    (removeBrands || []).map((brand) => {
                      return Types.ObjectId.createFromHexString(
                        brand as unknown as string,
                      );
                    }),
                  ],
                },

                brands.map((brand) => {
                  return Types.ObjectId.createFromHexString(
                    brand as unknown as string,
                  );
                }),
              ],
            },
          },
        },
      ],
    });

    if (!updatedCategory) {
      throw new NotFoundException('Fail to find matching Category instance');
    }

    return updatedCategory;
  }

  async updateAttachment(
    categoryId: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<CategoryDocument | Lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOne({
      filter: {
        _id: categoryId,
      },
    });
    if (!category) {
      throw new NotFoundException('Fail to find matching Category instance');
    }

    const image = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.Category}`,
    });

    const updatedCategory = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId },
      update: {
        image,
        createdBy: user._id,
      },
    });

    if (!updatedCategory) {
      await this.s3Service.deleteFile({ Key: image });
      throw new NotFoundException('Fail to find matching Category instance');
    }
    await this.s3Service.deleteFile({ Key: category.image });

    return updatedCategory;
  }

  async restore(
    categoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<CategoryDocument | Lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOneAndUpdate({
      filter: {
        _id: categoryId,
        freezedAt: { $exists: true },
        paranoid: false,
      },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: true },
        updatedBy: user._id,
      },
    });
    if (!category) {
      throw new NotFoundException(
        'Fail to matching matching Category instance',
      );
    }
    return category;
  }

  async freeze(
    categoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<string> {
    const category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: categoryId, freezedAt: { $exists: false } },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: true },
        updatedBy: user._id,
      },
    });

    if (!category) {
      throw new NotFoundException(
        'Fail to matching matching Category instance',
      );
    }

    return 'Done';
  }

  async remove(
    categoryId: Types.ObjectId,
    user: UserDocument,
  ): Promise<string> {
    const category = await this.categoryRepository.findOneAndDelete({
      filter: {
        _id: categoryId,
        freezedAt: { $exists: true },
        paranoid: false,
      },
    });

    if (!category) {
      throw new NotFoundException(
        'Fail to matching matching Category instance',
      );
    }
    await this.s3Service.deleteFile({ Key: category.image });
    return 'Done';
  }

  async findAll(
    data: GetAllDto,
    archive: boolean = false,
  ): Promise<{
    docsCount?: number;
    limit?: number;
    pages?: number;
    currentPage?: number;
    docs: CategoryDocument[] | Lean<CategoryDocument>[];
  }> {
    const { page, size, search } = data;
    const result = await this.categoryRepository.paginate({
      filter: {
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
              ],
            }
          : {}),
        ...(archive ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
      page,
      size,
    });

    return result;
  }

  async findOne(
    categoryId: Types.ObjectId,
    archive: boolean = false,
  ): Promise<CategoryDocument | Lean<CategoryDocument>> {
    const category = await this.categoryRepository.findOne({
      filter: {
        _id: categoryId,
        ...(archive ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
    });
    if (!category) {
      throw new NotFoundException('Fail to find matching instance');
    }
    return category;
  }
}
