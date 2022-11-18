import { getFromContainer } from 'class-validator';
import { Document, Mongoose, Schema } from 'mongoose';

export default async function getCountByCondition(model: string, schema: Schema, condition: any): Promise<number> {
  const mongoose = getFromContainer(Mongoose);
  // console.log(condition);
  console.log(mongoose.model(model, schema));
  return mongoose.model(model, schema).countDocuments(condition);
}
