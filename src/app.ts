/* eslint-disable promise/always-return */
import { setInterval } from 'node:timers/promises';

import { appConfig } from './config/application.config';
import { connect } from './db';
import { FakerCustomerDto } from './dtos/faker-customer';
import Customer from './models/customer';
import { randomNumber } from './utils';

connect()
  .then(async (connection) => {
    for await (const _ of setInterval(200)) {
      await createCustomers().catch(console.error);
    }
    await connection.disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err || new Error('CANT_MONGO_CONNECT'));
    process.exit(-1);
  });

async function createCustomers() {
  const dtos = Array.from(
    { length: randomNumber(1, 10) },
    () => new FakerCustomerDto(),
  );

  if (appConfig.DEBUG) {
    console.log('commit customers', dtos.length);
  }

  const result = await Customer.insertMany(dtos);
  return result;
}
