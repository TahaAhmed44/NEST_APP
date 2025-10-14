import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { GenderEnum, generateHash, ProviderEnum } from 'src/common';

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
  confirmEmail: string;

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
    enum: GenderEnum,
    default: GenderEnum.male,
  })
  gender: GenderEnum;

  @Prop({
    type: Date,
    required: false,
  })
  changeCredentialsTime: string;
}

const userSchema = SchemaFactory.createForClass(User);
export type UserDocument = HydratedDocument<User>;

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
