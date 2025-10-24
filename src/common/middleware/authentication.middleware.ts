import {
  BadRequestException,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { Response, NextFunction, Request } from 'express';
import { TokenService } from '../service';
import { TokenEnum } from '../enums';
import type { IAuthRequest } from '../interface';

export const preAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!(req.headers.authorization?.split(' ').length == 2)) {
    throw new BadRequestException('Missing authorization key!!!');
  }
  next();
};

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}
  async use(req: IAuthRequest, res: Response, next: NextFunction) {
    console.log('Request...');
    console.log({ AfterReq: req.headers.authorization });

    const { user, decoded } = await this.tokenService.decodedToken({
      authorization: req.headers.authorization ?? '',
      tokenType: TokenEnum.access,
    });

    req.credentials = { user, decoded };
    next();
  }
}
