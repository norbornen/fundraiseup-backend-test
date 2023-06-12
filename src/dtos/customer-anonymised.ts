import { ICustomer, TCustomerDocument } from '../models';
import { anonymise } from '../utils';

export class CustomerAnonymisedDto implements ICustomer {
  _id: TCustomerDocument['_id'];
  __v: TCustomerDocument['__v'];
  createdAt: TCustomerDocument['createdAt'];
  firstName: ICustomer['firstName'];
  lastName: ICustomer['lastName'];
  email: ICustomer['email'];
  address: ICustomer['address'];
  constructor(x: TCustomerDocument) {
    this._id = x._id;
    this.__v = x.__v;
    this.createdAt = x.createdAt;

    this.firstName = anonymise(x.firstName);
    this.lastName = anonymise(x.lastName);

    if (typeof x.email === 'string') {
      this.email = x.email.replace(/^(.+?)(?=@)/, (...args) =>
        anonymise(args.at(1)),
      );
    }

    if (x.address) {
      this.address = x.address;
      if (typeof this.address === 'object') {
        this.address.line1 = anonymise(x.address.line1);
        this.address.line2 = anonymise(x.address.line2);
        this.address.postcode = anonymise(x.address.postcode);
      }
    }
  }
}
