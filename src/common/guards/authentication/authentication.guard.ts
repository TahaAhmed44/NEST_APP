import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tokenName } from 'src/common/decorators';
import { TokenEnum } from 'src/common/enums';
import { TokenService } from 'src/common/service';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tokenType =
      this.reflector.getAllAndOverride<TokenEnum>(tokenName, [
        context.getHandler(),
      ]) ?? TokenEnum.access;
    console.log({ context, tokenType });

    let req: any;
    let authorization: string = '';
    switch (context.getType()) {
      case 'http':
        const httpCtx = context.switchToHttp();
        req = httpCtx.getRequest();
        authorization = req.headers.authorization;
        break;

      default:
        break;
    }

    const { user, decoded } = await this.tokenService.decodedToken({
      authorization,
      tokenType,
    });
    req.credentials = { user, decoded };
    return true;
  }
}
