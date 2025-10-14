import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { SignupBodyDTO } from './dto/auth.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserRepository } from 'src/DB';
import { Model } from 'mongoose';
import { generateHash } from 'src/common';

export interface IUser {
  id: number;
  userName: string;
  email: string;
  password: string;
}

@Injectable()
export class AuthenticationService {
  private users: IUser[] = [];
  constructor(private readonly userRepository: UserRepository) {}

  async signup(data: SignupBodyDTO): Promise<string> {
    const { email, password, userName } = data;
    const checkUserExist = await this.userRepository.findOne({
      filter: { email },
    });
    if (checkUserExist) {
      throw new ConflictException('Email already exist.');
    }
    const [user] = await this.userRepository.create({
      data: [
        {
          email,
          password,
          userName,
        },
      ],
    });
    if (!user) {
      throw new BadRequestException(
        'Fail to signup this account please try again later.',
      );
    }
    return 'Done';
  }
}
