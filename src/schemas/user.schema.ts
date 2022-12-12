import { EmailCredentials, FacebookCredentials, GoogleCredentials } from '@common/types/auth';
import { Organization } from './oraganization.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
import { hashPassword } from '@shared/utils/hash-password';
import { ApiProperty } from '@nestjs/swagger';
export type UserDocument = User & Document;

@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class User {
  @ApiProperty({ type: String })
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

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

  @Prop({ type: Object, required: true })
  credentials: EmailCredentials | GoogleCredentials | FacebookCredentials;

  email: string;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('email').get(function (this: UserDocument) {
  return this.credentials.email;
});

UserSchema.pre<UserDocument>('save', function (next) {
  if (this.isModified('credentials.password'))
    (this.credentials as EmailCredentials).password = hashPassword(
      (this.credentials as EmailCredentials).password,
    );

  next();
});

export { UserSchema };
