import { Document, model, Schema } from 'mongoose';

interface IKeyValue {
  key: string;
  value: any;
}

export type TKeyValueDocument = IKeyValue & Document;

const KeyValueSchema = new Schema<TKeyValueDocument>(
  {
    key: { type: String, unique: true, required: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: false,
    versionKey: false,
    validateBeforeSave: true,
  },
);

export default model('KeyValue', KeyValueSchema, '_keyvalue');
