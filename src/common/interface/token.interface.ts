import type { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { UserDocument } from 'src/DB';
import { IUser } from './user.interface';

export interface IToken {
  jti: string;

  expiredAt: Date;

  createdBy: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICredentials {
  user: UserDocument;
  decoded: JwtPayload;
}

export interface IAuthRequest extends Request {
  credentials: ICredentials;
}
