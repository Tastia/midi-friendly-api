import { UserDocument } from '@schemas/user.schema';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: UserDocument;
}
