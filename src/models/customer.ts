import { Document, model, Schema } from 'mongoose';

export interface ICustomer {
  firstName: string;
  lastName: string;
  email: string;
  address: {
    line1: string;
    line2: string;
    postcode: string;
    city: string;
    state: string;
    country: string;
  };
  createdAt?: Date;
}

export type TCustomerDocument = ICustomer & Document;

const CustomerSchema = new Schema<TCustomerDocument>(
  {
    firstName: String,
    lastName: String,
    email: String,
    address: Schema.Types.Mixed,
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  },
);

export default model('customers', CustomerSchema);
