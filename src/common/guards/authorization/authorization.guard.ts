import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { roleName } from 'src/common/decorators';
import { RoleEnum } from 'src/common/enums';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const accessRoles: RoleEnum[] =
      this.reflector.getAllAndOverride<RoleEnum[]>(roleName, [
        context.getHandler(),
      ]) ?? [];
    console.log({ context });

    let role: RoleEnum = RoleEnum.user;
    switch (context.getType()) {
      case 'http':
        const httpCtx = context.switchToHttp();
        role = httpCtx.getRequest().credentials.user.role;
        break;

      default:
        break;
    }

    return accessRoles.includes(role);
  }
}
