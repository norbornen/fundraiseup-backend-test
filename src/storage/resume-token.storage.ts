import assert from 'node:assert';

import { mongo } from 'mongoose';

import { appConfig } from '../config/application.config';
import KeyValueStorage, {
  TKeyValueDocument,
} from '../models/key-value-storage';

type TResumeToken = Readonly<mongo.ResumeToken>;

export class ResumeTokenStorage {
  private static key = 'resumeToken';
  private scheduler: ReturnType<typeof setTimeout> | undefined;
  private _value: TResumeToken;
  private _flushedValue: TResumeToken;

  constructor(private readonly commitFrequency = 1000) {
    const fn = async () => {
      this.scheduler = setTimeout(fn, this.commitFrequency);
      await this.flush().catch(console.error);
    };
    setTimeout(fn, this.commitFrequency);
  }

  set value(input: TResumeToken) {
    this._value = input;
  }

  async getResumeToken() {
    const result = await ResumeTokenStorage.getResumeToken();
    if (result) {
      this.value = this._flushedValue = result;
    }
    return result;
  }

  private async flush() {
    if (!this._value) {
      return Promise.resolve();
    }

    try {
      assert.deepStrictEqual(this._flushedValue, this._value);
    } catch {
      await ResumeTokenStorage.saveResumeToken(this._value);
      this._flushedValue = this._value;
    }
  }

  async destroy() {
    await this.flush();
    if (this.scheduler) {
      clearTimeout(this.scheduler);
      this.scheduler = undefined;
    }
  }

  private static async getResumeToken(): Promise<TResumeToken> {
    const record = await this.getResumeTokenDocument();
    return record?.value ?? null;
  }

  private static async saveResumeToken(inputResumeToken: TResumeToken) {
    if (appConfig.DEBUG) {
      console.log(`commit _keyvalue "${ResumeTokenStorage.key}"`);
    }

    await KeyValueStorage.collection.updateOne(
      { key: this.key },
      { $set: { key: this.key, value: inputResumeToken } },
      { upsert: true },
    );
  }

  private static async getResumeTokenDocument() {
    const result = await KeyValueStorage.collection
      .find({ key: this.key })
      .limit(1)
      .next();
    return (result ?? null) as TKeyValueDocument;
  }
}
