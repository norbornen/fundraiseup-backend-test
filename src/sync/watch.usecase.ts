import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';

import { mongo } from 'mongoose';

import Customer, { TCustomerDocument } from '../models/customer';
import CustomerAnonymised from '../models/customer-anonymised';
import { CustomerAnonymisedStorage } from '../storage/customer-anonymised.storage';
import { ResumeTokenStorage } from '../storage/resume-token.storage';
import { ISyncUsecase } from './sync.usecase.interface';

type TChangeStream = mongo.ChangeStream<
  TCustomerDocument,
  mongo.ChangeStreamDocument<TCustomerDocument>
>;

export class SyncWatchUsecase implements ISyncUsecase {
  private alive: boolean;
  private changeStream: TChangeStream | undefined;
  private customerAnonymisedStorage = new CustomerAnonymisedStorage();
  private resumeTokenStorage = new ResumeTokenStorage();

  async run() {
    this.alive = true;

    while (this.alive) {
      try {
        this.changeStream = await this.createChangeStream();
        if (this.changeStream) {
          let doc: mongo.ChangeStreamDocument<TCustomerDocument>;
          while ((doc = await this.changeStream.next())) {
            const resumeToken = this.changeStream.resumeToken;
            try {
              this.handleChangeStreamDocument(doc);
            } finally {
              if (resumeToken) {
                this.resumeTokenStorage.value = resumeToken;
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        /**
         * Задержимся на секунду перед следующей попыткой создать стрим
         */
        await setTimeout(1000);
      }
    }
  }

  handleChangeStreamDocument(
    doc: mongo.ChangeStreamDocument<TCustomerDocument>,
  ) {
    assert(!!doc);

    const { operationType } = doc;

    if (
      ['insert', 'update', 'replace'].includes(operationType) &&
      'fullDocument' in doc &&
      doc.fullDocument
    ) {
      void this.customerAnonymisedStorage.addCustomer(doc.fullDocument);
    }
    if (operationType === 'invalidate') {
      throw new Error('COLLECTION INVALIDATE');
    }
  }

  async createChangeStream() {
    const defaultOptions: mongo.ChangeStreamOptions = {
      fullDocument: 'updateLookup',
    };

    let newChangeStream: TChangeStream | undefined;

    // By resume token
    const resumeToken = await this.resumeTokenStorage.getResumeToken();
    if (resumeToken) {
      const options = {
        ...defaultOptions,
        startAfter: resumeToken,
      } satisfies mongo.ChangeStreamOptions;
      try {
        newChangeStream = Customer.collection.watch<TCustomerDocument>(
          undefined,
          options,
        );
        await newChangeStream.hasNext();
      } catch (err) {
        newChangeStream = undefined;
        console.error(err);
      }
    }

    // By last changes
    if (!newChangeStream) {
      const endDate = await this.findCustomerAnonymisedLastDate();
      if (endDate && endDate instanceof Date) {
        const startAtOperationTime = new mongo.Timestamp({
          t: Math.trunc(endDate.getTime() / 1000),
          i: 1,
        });
        const options = {
          ...defaultOptions,
          startAtOperationTime,
        } satisfies mongo.ChangeStreamOptions;
        try {
          newChangeStream = Customer.collection.watch<TCustomerDocument>(
            undefined,
            options,
          );
          await newChangeStream.hasNext();
        } catch (err) {
          newChangeStream = undefined;
          console.error(err);
        }
      }
    }

    // Create in any case
    newChangeStream ||= Customer.collection.watch<TCustomerDocument>(
      undefined,
      defaultOptions,
    );

    return newChangeStream;
  }

  async destroy() {
    this.alive = false;

    if (this.changeStream) {
      await this.changeStream.close().catch(console.error);
      this.changeStream = undefined;
    }

    if (this.customerAnonymisedStorage) {
      await this.customerAnonymisedStorage.destroy().catch(console.error);
      this.customerAnonymisedStorage = undefined;
    }

    if (this.resumeTokenStorage) {
      await this.resumeTokenStorage.destroy();
      this.resumeTokenStorage = undefined;
    }
  }

  private async findCustomerAnonymisedLastDate() {
    const record = await CustomerAnonymised.collection
      .find<TCustomerDocument>(undefined, {
        projection: { createdAt: 1, _id: 0 },
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .next();
    return record?.createdAt ?? null;
  }
}
