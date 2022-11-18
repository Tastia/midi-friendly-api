import { Organization } from './oraganization.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Exclude, Transform } from 'class-transformer';
import { hashPassword } from '@shared/utils/hash-password';
export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  email: string;

  @Prop()
  avatar?: string;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }])
  organizations: Organization[];

  @Prop({ type: String, select: false })
  @Exclude()
  password: string;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', function (next) {
  if (this.isModified('password')) {
    this.password = hashPassword(this.password);
  }
  next();
});

export { UserSchema };
