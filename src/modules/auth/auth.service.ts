import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConfirmEmailDTO,
  LoginBodyDTO,
  ResendConfirmEmailDTO,
  SignupBodyDTO,
} from './dto/auth.dto';
import { OtpRepository, UserDocument, UserRepository } from 'src/DB';
import {
  compareHash,
  generateNumericalOtp,
  LoginCredentialsResponse,
  OtpEnum,
  ProviderEnum,
  TokenService,
} from 'src/common';
import { Types } from 'mongoose';

export interface IUser {
  id: number;
  userName: string;
  email: string;
  password: string;
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly otpRepository: OtpRepository,
    private readonly tokenService: TokenService,
  ) {}

  private async createConfirmEmailOtp(userId: Types.ObjectId) {
    await this.otpRepository.create({
      data: [
        {
          code: generateNumericalOtp(),
          expiredAt: new Date(Date.now() + 2 * 60 * 1000),
          type: OtpEnum.confirmEmail,
          createdBy: userId,
        },
      ],
    });
  }

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
    await this.createConfirmEmailOtp(user._id);
    return 'Done';
  }

  async login(data: LoginBodyDTO): Promise<LoginCredentialsResponse> {
    const { email, password } = data;
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmAt: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });

    if (!user) {
      throw new NotFoundException('In-valid login data.');
    }

    if (
      !(await compareHash({ plainText: password, hashValue: user.password }))
    ) {
      throw new NotFoundException('In-valid login Data.');
    }

    return await this.tokenService.createLoginCredentials(user as UserDocument);
  }

  async resendConfirmEmail(data: ResendConfirmEmailDTO): Promise<string> {
    const { email } = data;
    const user = await this.userRepository.findOne({
      filter: { email, confirmAt: { $exists: false } },
      options: {
        populate: [{ path: 'otp', match: { type: OtpEnum.confirmEmail } }],
      },
    });
    console.log({ user });

    if (!user) {
      throw new NotFoundException('Fail to find matching account.');
    }

    if (user.otp?.length) {
      throw new ConflictException(
        `Sorry we cannot send you new OTP till the existing one become expired please try again later after ${user.otp[0].expiredAt}`,
      );
    }
    await this.createConfirmEmailOtp(user._id);
    return 'Done';
  }

  async confirmEmail(data: ConfirmEmailDTO): Promise<string> {
    const { email, code } = data;
    const user = await this.userRepository.findOne({
      filter: { email, confirmAt: { $exists: false } },
      options: {
        populate: [{ path: 'otp', match: { type: OtpEnum.confirmEmail } }],
      },
    });
    console.log({ user });

    if (!user) {
      throw new NotFoundException('Fail to find matching account.');
    }

    if (
      !(
        user.otp?.length &&
        (await compareHash({ plainText: code, hashValue: user.otp[0].code }))
      )
    ) {
      throw new BadRequestException('In-valid Code.');
    }

    user.confirmAt = new Date();
    user.save();
    await this.otpRepository.deleteOne({ filter: { _id: user.otp[0]._id } });
    return 'Done';
  }
}
