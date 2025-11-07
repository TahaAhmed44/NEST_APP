import { Types } from 'mongoose';
import { OtpEnum } from '../enums';
import { IUser } from './user.interface';

export interface IOtp {
  _id?: Types.ObjectId;

  code: string;
  expiredAt: Date;

  createdBy: Types.ObjectId | IUser;

  type: OtpEnum;

  createdAt?: Date;
  updatedAt?: Date;
}
