import { UserOnboardingState } from './../common/types/auth';
import { EmailCredentials, ProviderCredentials } from '@common/types/auth';
import { Organization } from './oraganization.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { hashPassword } from '@shared/utils/hash-password';
import { ApiProperty } from '@nestjs/swagger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class User {
  @ApiProperty({ type: String })
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ default: { mapsApp: false, adminApp: false } })
  onboarding?: UserOnboardingState;

  @ApiProperty()
  @Prop()
  firstName: string;

  @ApiProperty()
  @Prop()
  lastName: string;

  @ApiProperty()
  @Prop()
  avatar?: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }])
  organizations: Organization[];

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }])
  adminOrganizations: Organization[];

  @Prop({ type: Object, required: true })
  credentials: EmailCredentials | ProviderCredentials;

  @Prop({ type: Boolean, default: false })
  admin: boolean;

  email: string;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('email').get(function (this: UserDocument) {
  return this.credentials?.email ?? '';
});

UserSchema.pre<UserDocument>('save', function (next) {
  if (this.isModified('credentials.password') && (this.credentials as EmailCredentials).password)
    (this.credentials as EmailCredentials).password = hashPassword(
      (this.credentials as EmailCredentials).password,
    );

  if (this.isModified('credentials.userId') && (this.credentials as ProviderCredentials).userId)
    (this.credentials as ProviderCredentials).userId = hashPassword(
      (this.credentials as ProviderCredentials).userId,
    );

  next();
});

UserSchema.plugin(aggregatePaginate);

export { UserSchema };
