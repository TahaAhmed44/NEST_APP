import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { IsMatched } from 'src/common';

export class SignupBodyDTO {
  @IsString()
  @MinLength(2, { message: 'userName must be greater than 2 char' })
  @MaxLength(51, { message: 'userName must be less than 51 char' })
  userName: string;

  @IsEmail()
  email: string;
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;

  @ValidateIf(function (data: SignupBodyDTO) {
    return Boolean(data.password);
  })
  @IsMatched<string>(['password'], {
    message: 'password not identical with confirmPassword',
  })
  confirmPassword: string;
}
