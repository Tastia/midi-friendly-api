import { InvitationDocument } from '@schemas/invitation.schema';
import { Invitation } from '@schemas/invitation.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { PopulateQuery } from '@common/types/mongoose';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectModel(Invitation.name) private readonly invitationModel: Model<InvitationDocument>,
  ) {}

  find(filter?: FilterQuery<InvitationDocument>, populate?: PopulateQuery) {
    return this.invitationModel.find(filter ?? {}).populate(populate ?? ('' as any));
  }

  findOne(filter?: FilterQuery<InvitationDocument>, populate?: PopulateQuery) {
    return this.invitationModel.findOne(filter ?? {}).populate(populate ?? ('' as any));
  }
}
