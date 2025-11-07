import { Types } from 'mongoose';
import { GenderEnum, LanguageEnum, ProviderEnum, RoleEnum } from '../enums';
import { OtpDocument } from 'src/DB';

export interface IUser {
  _id?: Types.ObjectId;

  firstName: string;
  lastName: string;
  userName?: string;

  email: string;

  confirmAt?: Date;

  password?: string;

  provider: ProviderEnum;

  preferredLanguage: LanguageEnum;

  role: RoleEnum;

  gender: GenderEnum;

  changeCredentialsTime?: Date;

  otp: OtpDocument[];

  profileImage: string;

  createdAt?: Date;
  updatedAt?: Date;
}
