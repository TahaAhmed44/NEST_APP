import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import {
  GenderEnum,
  generateHash,
  LanguageEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/common';
import { OtpDocument } from './otp.model';
import { HydratedDocument } from 'mongoose';

@Schema({
  timestamps: true,
  strictQuery: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 25,
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 25,
  })
  lastName: string;

  @Virtual({
    get: function (this: User) {
      return this.firstName + ' ' + this.lastName;
    },
    set(value: string) {
      const [firstName, lastName] = value.split(' ') || [];
      this.set({ firstName, lastName });
    },
  })
  userName: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    type: Date,
    required: false,
  })
  confirmAt: Date;

  @Prop({
    type: String,
    required: function (this: User) {
      return this.provider === ProviderEnum.SYSTEM ? true : false;
    },
  })
  password: string;

  @Prop({
    type: String,
    enum: ProviderEnum,
    default: ProviderEnum.SYSTEM,
  })
  provider: ProviderEnum;

  @Prop({
    type: String,
    enum: LanguageEnum,
    default: LanguageEnum.AR,
  })
  preferredLanguage: LanguageEnum;

  @Prop({
    type: String,
    enum: RoleEnum,
    default: RoleEnum.user,
  })
  role: RoleEnum;

  @Prop({
    type: String,
    enum: GenderEnum,
    default: GenderEnum.male,
  })
  gender: GenderEnum;

  @Prop({
    type: Date,
    required: false,
  })
  changeCredentialsTime: Date;

  @Virtual()
  otp: OtpDocument[];
}

const userSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User>;

userSchema.virtual('otp', {
  localField: '_id',
  foreignField: 'createdBy',
  ref: 'Otp',
});

//Hashing-Password
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await generateHash({ plainText: this.password });
  }
  next();
});

export const UserModel = MongooseModule.forFeature([
  {
    name: User.name,
    schema: userSchema,
  },
]);
