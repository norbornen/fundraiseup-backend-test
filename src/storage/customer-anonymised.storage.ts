import { clearTimeout, setTimeout } from 'node:timers';

import PQueue from 'p-queue';

import { appConfig } from '../config/application.config';
import { CustomerAnonymisedDto } from '../dtos/customer-anonymised';
import { TCustomerDocument } from '../models/customer';
import CustomerAnonymised from '../models/customer-anonymised';

export class CustomerAnonymisedStorage {
  private storage = new Map<string, CustomerAnonymisedDto>();
  private pending = new Map<
    string,
    Parameters<ConstructorParameters<typeof Promise>['0']>
  >();
  private queue = new PQueue({ concurrency: 1 });
  private scheduler: ReturnType<typeof setTimeout> | undefined;

  constructor(
    private readonly commitFrequency = 1000,
    private readonly commitRecordsLimit = 1000,
  ) {
    const fn = async () => {
      this.scheduler = setTimeout(fn, this.commitFrequency);
      await this.flush().catch(console.error);
    };
    setTimeout(fn, this.commitFrequency);
  }

  async addCustomer(aCustomer: TCustomerDocument) {
    const key = aCustomer._id;
    const customerAnonymisedDto = new CustomerAnonymisedDto(aCustomer);
    this.storage.set(key, customerAnonymisedDto);

    return new Promise<void>((resolve, reject) => {
      this.pending.set(key, [resolve, reject]);

      if (this.storage.size >= this.commitRecordsLimit) {
        this.scheduler?.refresh();
        this.flush().catch(console.error);
      }
    });
  }

  private async flush() {
    if (this.storage.size === 0) {
      return Promise.resolve();
    }

    const storage = this.storage;
    this.storage = new Map();

    return this.queue.add(async () => {
      try {
        await this.commit(storage);
        /**
         * Resolve promises
         */
        for (const key of storage.keys()) {
          if (this.pending.has(key)) {
            this.pending.get(key)?.[0](void 1);
            this.pending.delete(key);
          }
        }
      } catch (err) {
        console.error(err);
        /**
         * Reject promises
         */
        for (const key of storage.keys()) {
          if (this.pending.has(key)) {
            this.pending.get(key)?.[1](err);
            this.pending.delete(key);
          }
        }
      }
    });
  }

  private async commit(
    inputRecords: Map<string, CustomerAnonymisedDto> | CustomerAnonymisedDto[],
  ) {
    const operations: Parameters<
      (typeof CustomerAnonymised)['bulkWrite']
    >['0'] = [];
    for (const item of Array.isArray(inputRecords)
      ? inputRecords
      : inputRecords.values()) {
      operations.push({
        replaceOne: {
          filter: { _id: item._id },
          replacement: item,
          upsert: true,
        },
      });
    }

    if (operations.length && appConfig.DEBUG) {
      console.log('commit customers_anonymised', operations.length);
    }

    if (operations.length) {
      await CustomerAnonymised.bulkWrite(operations);
    }
  }

  async destroy() {
    if (this.scheduler) {
      clearTimeout(this.scheduler);
      this.scheduler = undefined;
    }
    if (this.storage?.size > 0) {
      await this.flush();
    }
    await this.queue.onIdle();
  }
}
