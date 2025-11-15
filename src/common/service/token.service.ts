import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, JwtSignOptions, JwtVerifyOptions } from '@nestjs/jwt';
import { JwtPayload } from 'jsonwebtoken';
import { RoleEnum, SignatureLevelEnum, TokenEnum } from 'src/common';
import {
  TokenDocument,
  TokenRepository,
  UserDocument,
  UserRepository,
} from 'src/DB';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { parseObjectId } from '../utils/objectId';
import { LoginCredentialsResponse } from '../entities';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly tokenRepository: TokenRepository,
  ) {}
  generateToken = async ({
    payload,
    options = {
      expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
      secret: process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
    },
  }: {
    payload: object;
    options?: JwtSignOptions;
  }): Promise<string> => {
    return await this.jwtService.signAsync(payload, options);
  };

  verifyToken = async ({
    token,
    options = { secret: process.env.ACCESS_USER_TOKEN_SIGNATURE as string },
  }: {
    token: string;
    options?: JwtVerifyOptions;
  }): Promise<JwtPayload> => {
    return await this.jwtService.verifyAsync(token, options);
  };

  detectSignatureLevel = async (
    role: RoleEnum = RoleEnum.user,
  ): Promise<SignatureLevelEnum> => {
    let signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer;
    switch (role) {
      case RoleEnum.admin:
        signatureLevel = SignatureLevelEnum.System;
        break;
      case RoleEnum.superAdmin:
        signatureLevel = SignatureLevelEnum.System;
        break;
      default:
        signatureLevel = SignatureLevelEnum.Bearer;
        break;
    }
    return signatureLevel;
  };

  getSignatures = async (
    signatureLevel: SignatureLevelEnum = SignatureLevelEnum.Bearer,
  ): Promise<{ access_Signature: string; refresh_Signature: string }> => {
    let signatures: { access_Signature: string; refresh_Signature: string } = {
      access_Signature: '',
      refresh_Signature: '',
    };
    switch (signatureLevel) {
      case SignatureLevelEnum.System:
        signatures.access_Signature = process.env
          .ACCESS_SYSTEM_TOKEN_SIGNATURE as string;
        signatures.refresh_Signature = process.env
          .REFRESH_SYSTEM_TOKEN_SIGNATURE as string;
        break;
      default:
        signatures.access_Signature = process.env
          .ACCESS_USER_TOKEN_SIGNATURE as string;
        signatures.refresh_Signature = process.env
          .REFRESH_USER_TOKEN_SIGNATURE as string;
        break;
    }
    return signatures;
  };

  createLoginCredentials = async (
    user: UserDocument,
  ): Promise<LoginCredentialsResponse> => {
    const signatureLevel = await this.detectSignatureLevel(user.role);
    const signatures = await this.getSignatures(signatureLevel);
    console.log({ signatures });

    const jwtid = randomUUID();
    const access_token = await this.generateToken({
      payload: {
        sub: user._id,
      },
      options: {
        expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),
        secret: signatures.access_Signature,
        jwtid,
      },
    });

    const refresh_token = await this.generateToken({
      payload: {
        sub: user._id,
      },
      options: {
        expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        secret: signatures.refresh_Signature,
        jwtid,
      },
    });

    return { access_token, refresh_token };
  };

  decodedToken = async ({
    authorization,
    tokenType = TokenEnum.access,
  }: {
    authorization: string;
    tokenType?: TokenEnum;
  }) => {
    try {
      const [bearerKey, token] = authorization.split(' ');
      if (!bearerKey || !token) {
        throw new UnauthorizedException('Missing token parts.');
      }

      const signatures = await this.getSignatures(
        bearerKey as SignatureLevelEnum,
      );
      const decoded = await this.verifyToken({
        token,
        options: {
          secret:
            tokenType === TokenEnum.refresh
              ? signatures.refresh_Signature
              : signatures.access_Signature,
        },
      });
      console.log(decoded);

      if (!decoded?.sub || !decoded?.iat) {
        throw new BadRequestException('In-valid token payload.');
      }

      if (
        await this.tokenRepository.findOne({ filter: { jti: decoded.jti } })
      ) {
        throw new UnauthorizedException('In-valid or login credentials.');
      }

      const user = (await this.userRepository.findOne({
        filter: { _id: decoded.sub },
      })) as UserDocument;
      if (!user) {
        throw new NotFoundException('Not register account.');
      }

      if ((user.changeCredentialsTime?.getTime() || 0) > decoded.iat * 1000) {
        throw new UnauthorizedException('In-valid or login credentials.');
      }

      return { user, decoded };
    } catch (error) {
      throw new InternalServerErrorException(
        (error.message && error.stack) || 'something went wrong!!',
      );
    }
  };

  createRevokeToken = async (decoded: JwtPayload): Promise<TokenDocument> => {
    const [result] =
      (await this.tokenRepository.create({
        data: [
          {
            jti: decoded?.jti as string,
            expiredAt: new Date(
              (decoded?.iat as number) +
                Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
            ),
            createdBy: parseObjectId(decoded?.sub as string),
          },
        ],
      })) || [];
    if (!result) {
      throw new BadRequestException('Fail to revoke this token.');
    }
    return result;
  };
}
