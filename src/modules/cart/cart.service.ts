import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { RemoveItemsFromCartDto } from './dto/update-cart.dto';
import {
  CartDocument,
  CartRepository,
  ProductDocument,
  ProductRepository,
  UserDocument,
} from 'src/DB';
import { Lean } from 'src/DB/repository/database.repository';

@Injectable()
export class CartService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cartRepository: CartRepository,
  ) {}
  async create(
    createCartDto: CreateCartDto,
    user: UserDocument,
  ): Promise<{ status: number; cart: CartDocument | Lean<CartDocument> }> {
    const product = await this.productRepository.findOne({
      filter: {
        _id: createCartDto.productId,
        stock: { $gte: createCartDto.quantity },
      },
    });
    if (!product) {
      throw new NotFoundException(
        'Fail to find matching product instance or product is out of stock',
      );
    }

    const cart = await this.cartRepository.findOne({
      filter: {
        createdBy: user._id,
      },
    });
    if (!cart) {
      const [newCart] = await this.cartRepository.create({
        data: [
          {
            createdBy: user._id,
            products: [
              { productId: product._id, quantity: createCartDto.quantity },
            ],
          },
        ],
      });
      if (!newCart) {
        throw new BadRequestException('Fail to create user cart');
      }

      // await this.productRepository.updateOne({
      //   filter: {
      //     _id: product._id,
      //   },
      //   update: {
      //     stock: product.stock - createCartDto.quantity,
      //   },
      // });

      return { status: 201, cart: newCart };
    }

    const checkProductInCart = cart.products.find((product) => {
      return product.productId == createCartDto.productId;
    });
    if (checkProductInCart) {
      checkProductInCart.quantity += createCartDto.quantity;
    } else {
      cart.products.push({
        productId: product._id,
        quantity: createCartDto.quantity,
      });
    }

    // await this.productRepository.updateOne({
    //   filter: {
    //     _id: product._id,
    //   },
    //   update: {
    //     stock: product.stock - createCartDto.quantity,
    //   },
    // });

    await cart.save();
    return { status: 200, cart };
  }

  async removeItemsFromCart(
    removeItemsFromCartDto: RemoveItemsFromCartDto,
    user: UserDocument,
  ): Promise<CartDocument | Lean<CartDocument>> {
    console.log({ removeItemsFromCartDto });

    const cart = await this.cartRepository.findOneAndUpdate({
      filter: {
        createdBy: user._id,
      },
      update: {
        $pull: {
          products: { _id: { $in: removeItemsFromCartDto.productIds } },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('Fail to find matching user cart.');
    }
    return cart;
  }

  async remove(user: UserDocument): Promise<string> {
    const cart = await this.cartRepository.deleteOne({
      filter: { createdBy: user._id },
    });
    if (!cart.deletedCount) {
      throw new BadRequestException('Fail to clear the cart');
    }

    return 'Done';
  }

  async findOne(
    user: UserDocument,
  ): Promise<CartDocument | Lean<CartDocument>> {
    const cart = await this.cartRepository.findOne({
      filter: { createdBy: user._id },
      options: { populate: [{ path: 'products.productId' }] },
    });
    if (!cart) {
      throw new BadRequestException('Fail to find user cart');
    }
    return cart;
  }

  // findAll() {
  //   return `This action returns all cart`;
  // }

  // findOne(id: number) {
  //   return `This action returns a #${id} cart`;
  // }

  // update(id: number, updateCartDto: UpdateCartDto) {
  //   return `This action updates a #${id} cart`;
  // }
}
