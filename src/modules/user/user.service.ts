import { Injectable } from '@nestjs/common';
import { IUser } from '../auth/auth.service';

@Injectable()
export class UserService {
  constructor() {}
  profile(userId: string): IUser {
    return {
      id: Number(userId),
      userName: 'aasdas',
      email: 'asdasd@gmail.com',
      password: 'asdasd52545',
    };
  }
}
