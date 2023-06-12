import { faker } from '@faker-js/faker';
import { ICustomer } from 'models';

export class FakerCustomerDto implements ICustomer {
  firstName: ICustomer['firstName'];
  lastName: ICustomer['lastName'];
  email: ICustomer['email'];
  address: ICustomer['address'];
  constructor() {
    this.firstName = faker.person.firstName();
    this.lastName = faker.person.lastName();
    this.email = faker.internet.email({
      firstName: this.firstName,
      lastName: this.lastName,
    });
    this.address = {
      line1: faker.location.streetAddress(),
      line2: faker.location.secondaryAddress(),
      postcode: faker.location.zipCode(),
      city: faker.location.city(),
      state: faker.location.state(),
      country: faker.location.country(),
    };
  }
}
