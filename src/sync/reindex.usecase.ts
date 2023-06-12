import Customer, { TCustomerDocument } from '../models/customer';
import { CustomerAnonymisedStorage } from '../storage/customer-anonymised.storage';
import { ISyncUsecase } from './sync.usecase.interface';

export class SyncReindexUsecase implements ISyncUsecase {
  private storage = new CustomerAnonymisedStorage(1050);

  async run() {
    const cursor = Customer.collection.find().sort({
      createdAt: 'asc',
      _id: 'asc',
    });

    let lastPromise: Promise<any> | undefined;
    for await (const record of cursor) {
      lastPromise = this.storage.addCustomer(record as TCustomerDocument);
    }

    if (lastPromise) {
      await lastPromise.catch(console.error);
    }
  }

  async runOnce() {
    await this.run();
    await this.destroy();
  }

  async destroy() {
    if (this.storage) {
      await this.storage.destroy().catch(console.error);
      this.storage = undefined;
    }
  }
}
