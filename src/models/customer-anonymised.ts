import { model, Schema } from 'mongoose';

import { ICustomer } from './customer';

const CustomerAnonymisedSchema = new Schema<ICustomer>(
  {
    firstName: String,
    lastName: String,
    email: String,
    address: Schema.Types.Mixed,
    createdAt: Schema.Types.Date,
  },
  {
    timestamps: false,
    versionKey: false,
    validateBeforeSave: false,
  },
);

export default model(
  'customers_anonymised',
  CustomerAnonymisedSchema,
  'customers_anonymised',
);
