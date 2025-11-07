import {
  BadRequestException,
  ConflictException,
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
import { FolderEnum, S3Service } from 'src/common';
import { randomUUID } from 'node:crypto';

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

    const checkDuplicated = await this.productRepository.findOne({
      filter: { name, paranoid: false },
    });

    // if (checkDuplicated) {
    //   throw new ConflictException(
    //     checkDuplicated.freezedAt
    //       ? 'Duplicated with archived product'
    //       : 'Duplicated product name',
    //   );
    // }

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

  findAll() {
    return `This action returns all product`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
