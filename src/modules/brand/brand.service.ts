import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandDocument, BrandRepository, UserDocument } from 'src/DB';
import { FolderEnum, S3Service } from 'src/common';
import { Types } from 'mongoose';
import { GetAllDto, UpdateBrandDto } from './dto/update-brand.dto';
import { Lean } from 'src/DB/repository/database.repository';

@Injectable()
export class BrandService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createBrandDto: CreateBrandDto,
    user: UserDocument,
    file: Express.Multer.File,
  ): Promise<BrandDocument> {
    const { name, slogan } = createBrandDto;
    const checkDuplicated = await this.brandRepository.findOne({
      filter: { name, paranoid: false },
    });

    if (checkDuplicated) {
      throw new ConflictException(
        checkDuplicated.freezedAt
          ? 'Duplicated with archived brand'
          : 'Duplicated brand name.',
      );
    }

    const image: string = await this.s3Service.uploadFile({
      file,
      path: `Brand`,
    });

    const [brand] = await this.brandRepository.create({
      data: [{ name, slogan, createdBy: user._id, image }],
    });
    if (!brand) {
      await this.s3Service.deleteFile({ Key: image });
      throw new BadRequestException('Fail to create this brand resource');
    }

    return brand;
  }

  async update(
    brandId: Types.ObjectId,
    updateBrandDto: UpdateBrandDto,
    user: UserDocument,
  ): Promise<BrandDocument | Lean<BrandDocument>> {
    if (
      updateBrandDto.name &&
      (await this.brandRepository.findOne({
        filter: { name: updateBrandDto.name },
      }))
    ) {
      throw new ConflictException('Duplicated brand name.');
    }

    const updatedBrand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        ...updateBrandDto,
        createdBy: user._id,
      },
    });

    if (!updatedBrand) {
      throw new NotFoundException('Fail to find matching brand instance');
    }

    return updatedBrand;
  }

  async updateAttachment(
    brandId: Types.ObjectId,
    file: Express.Multer.File,
    user: UserDocument,
  ): Promise<BrandDocument | Lean<BrandDocument>> {
    const image = await this.s3Service.uploadFile({
      file,
      path: `${FolderEnum.Brand}`,
    });

    const updatedBrand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId },
      update: {
        image,
        createdBy: user._id,
      },
      options: { new: false },
    });

    if (!updatedBrand) {
      await this.s3Service.deleteFile({ Key: image });
      throw new NotFoundException('Fail to find matching brand instance');
    }
    await this.s3Service.deleteFile({ Key: updatedBrand.image });
    updatedBrand.image = image;

    return updatedBrand;
  }

  async restore(
    brandId: Types.ObjectId,
    user: UserDocument,
  ): Promise<BrandDocument | Lean<BrandDocument>> {
    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId, freezedAt: { $exists: true }, paranoid: false },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: true },
        updatedBy: user._id,
      },
    });
    if (!brand) {
      throw new NotFoundException('Fail to matching matching brand instance');
    }
    return brand;
  }

  async freeze(brandId: Types.ObjectId, user: UserDocument): Promise<string> {
    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId, freezedAt: { $exists: false } },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: true },
        updatedBy: user._id,
      },
    });

    if (!brand) {
      throw new NotFoundException('Fail to matching matching brand instance');
    }

    return 'Done';
  }

  async remove(brandId: Types.ObjectId, user: UserDocument): Promise<string> {
    const brand = await this.brandRepository.findOneAndDelete({
      filter: { _id: brandId, freezedAt: { $exists: true }, paranoid: false },
    });

    if (!brand) {
      throw new NotFoundException('Fail to matching matching brand instance');
    }
    await this.s3Service.deleteFile({ Key: brand.image });
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
    docs: BrandDocument[] | Lean<BrandDocument>[];
  }> {
    const { page, size, search } = data;
    const result = await this.brandRepository.paginate({
      filter: {
        ...(search
          ? {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { slogan: { $regex: search, $options: 'i' } },
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
    brandId: Types.ObjectId,
    archive: boolean = false,
  ): Promise<BrandDocument | Lean<BrandDocument>> {
    const brand = await this.brandRepository.findOne({
      filter: {
        _id: brandId,
        ...(archive ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
    });
    if (!brand) {
      throw new NotFoundException('Fail to find matching instance');
    }
    return brand;
  }


}
