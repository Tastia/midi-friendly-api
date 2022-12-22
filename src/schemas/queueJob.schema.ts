import { QueueJobStatus, Queues, WorkerJobRecordParams } from '@common/types/queue.type';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { Transform } from 'class-transformer';
export type QueueJobDocument = QueueJob & Document;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const aggregatePaginate = require('mongoose-aggregate-paginate-v2');

@Schema({ timestamps: true })
export class QueueJob {
  @Transform(({ value }) => value.toString())
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true })
  queue: Queues;

  @Prop({ required: true })
  operation: string;

  @Prop({ required: true })
  params: WorkerJobRecordParams;

  @Prop({ type: Object })
  result: { [key: string]: any };

  @Prop({ required: true, default: QueueJobStatus.Pending })
  status: string;

  @Prop({ required: true, default: 0 })
  attempts: number;
}

const QueueJobSchema = SchemaFactory.createForClass(QueueJob);

QueueJobSchema.plugin(aggregatePaginate);

export { QueueJobSchema };
