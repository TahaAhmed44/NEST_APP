import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  BrandRepository,
  CategoryRepository,
  ProductDocument,
  ProductRepository,
  UserDocument,
} from 'src/DB';
import { FolderEnum, GetAllDto, S3Service } from 'src/common';
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { Lean } from 'src/DB/repository/database.repository';

@Injectable()
export class ProductService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly brandRepository: BrandRepository,
    private readonly productRepository: ProductRepository,
    private readonly s3Service: S3Service,
  ) {}
  async create(
    createProductDto: CreateProductDto,
    files: Express.Multer.File[],
    user: UserDocument,
  ): Promise<ProductDocument> {
    const { name, originalPrice, stock, description, discountPercent } =
      createProductDto;

    const category = await this.categoryRepository.findOne({
      filter: { _id: createProductDto.category },
    });

    if (!category) {
      throw new NotFoundException('Fail to find matching category instance');
    }
    const brand = await this.brandRepository.findOne({
      filter: { _id: createProductDto.brand },
    });

    if (!brand) {
      throw new NotFoundException('Fail to find matching brand instance');
    }

    let assetFolderId: string = randomUUID();

    const images = await this.s3Service.uploadFiles({
      files,
      path: `${FolderEnum.Category}/${createProductDto.category}/${FolderEnum.Product}/${assetFolderId}`,
    });

    const [product] = await this.productRepository.create({
      data: [
        {
          brand: brand._id,
          category: category._id,
          name,
          images,
          originalPrice,
          stock,
          salePrice:
            originalPrice - originalPrice * ((discountPercent || 0) / 100),
          description,
          discountPercent,
          assetFolderId,
          createdBy: user._id,
        },
      ],
    });

    if (!product) {
      await this.s3Service.deleteFiles({ urls: images });
      throw new BadRequestException('Fail to create product instance');
    }

    return product;
  }

  async update(
    productId: Types.ObjectId,
    updateProductDto: UpdateProductDto,
    user: UserDocument,
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: { _id: productId },
    });
    if (!product) {
      throw new NotFoundException('Fail to find matching product instance');
    }

    if (updateProductDto.category) {
      const category = await this.categoryRepository.findOne({
        filter: { _id: updateProductDto.category },
      });

      if (!category) {
        throw new NotFoundException('Fail to find matching category instance');
      }
      updateProductDto.category = category._id;
    }

    if (updateProductDto.brand) {
      const brand = await this.brandRepository.findOne({
        filter: { _id: updateProductDto.brand },
      });

      if (!brand) {
        throw new NotFoundException('Fail to find matching brand instance');
      }
      updateProductDto.brand = brand._id;
    }

    let salePrice = product.salePrice;
    if (updateProductDto.originalPrice || updateProductDto.discountPercent) {
      const originalPrice =
        updateProductDto.originalPrice ?? product.originalPrice;
      const discountPercent =
        updateProductDto.discountPercent ?? product.discountPercent;
      const finalPrice =
        originalPrice - originalPrice * (discountPercent / 100);
      salePrice = finalPrice > 0 ? finalPrice : 1;
    }

    const updatedProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        ...updateProductDto,
        salePrice,
        updatedBy: user._id,
      },
    });
    if (!updatedProduct) {
      throw new BadRequestException('Fail to update product instance');
    }

    return updatedProduct;
  }

  async updateAttachments(
    productId: Types.ObjectId,
    files: Express.Multer.File[],
    user: UserDocument,
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
      },
    });
    if (!product) {
      throw new NotFoundException('Fail to find matching product instance');
    }

    const images = await this.s3Service.uploadFiles({
      files,
      path: `${FolderEnum.Product}`,
    });

    const updatedProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId },
      update: {
        images,
        createdBy: user._id,
      },
    });

    if (!updatedProduct) {
      await this.s3Service.deleteFiles({ urls: images });
      throw new NotFoundException('Fail to find matching product instance');
    }
    await this.s3Service.deleteFiles({ urls: product.images });

    return updatedProduct;
  }

  async restore(
    productId: Types.ObjectId,
    user: UserDocument,
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOneAndUpdate({
      filter: {
        _id: productId,
        freezedAt: { $exists: true },
        paranoid: false,
      },
      update: {
        restoredAt: new Date(),
        $unset: { freezedAt: true },
        updatedBy: user._id,
      },
    });
    if (!product) {
      throw new NotFoundException('Fail to matching matching product instance');
    }
    return product;
  }

  async freeze(productId: Types.ObjectId, user: UserDocument): Promise<string> {
    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId, freezedAt: { $exists: false } },
      update: {
        freezedAt: new Date(),
        $unset: { restoredAt: true },
        updatedBy: user._id,
      },
    });

    if (!product) {
      throw new NotFoundException('Fail to matching matching product instance');
    }

    return 'Done';
  }

  async remove(productId: Types.ObjectId, user: UserDocument): Promise<string> {
    const product = await this.productRepository.findOneAndDelete({
      filter: {
        _id: productId,
        freezedAt: { $exists: true },
        paranoid: false,
      },
    });

    if (!product) {
      throw new NotFoundException('Fail to matching matching product instance');
    }
    await this.s3Service.deleteFiles({ urls: product.images });
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
    docs: ProductDocument[] | Lean<ProductDocument>[];
  }> {
    const { page, size, search } = data;
    const result = await this.productRepository.paginate({
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
    productId: Types.ObjectId,
    archive: boolean = false,
  ): Promise<ProductDocument | Lean<ProductDocument>> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: productId,
        ...(archive ? { paranoid: false, freezedAt: { $exists: true } } : {}),
      },
    });
    if (!product) {
      throw new NotFoundException('Fail to find matching instance');
    }
    return product;
  }
}
