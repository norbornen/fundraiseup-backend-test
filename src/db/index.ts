import mongoose from 'mongoose';

import { appConfig } from '../config/application.config';

let connection: mongoose.Mongoose | undefined;

export const connect = async () => {
  connection = undefined;
  connection = await mongoose.connect(appConfig.DB_URI, {
    dbName: appConfig.DB_NAME,
  });

  await connection.connection.db.command({ ping: 1 });

  return connection;
};

export const getConnection = () => connection;

// mongoose.connection.on('disconnected', connect);

mongoose.connection.on('connected', () => {
  if (appConfig.DEBUG) {
    console.log(`Mongodb connection open to ${appConfig.DB_URI}`);
  }
});

mongoose.connection.on('error', (err) => {
  if (appConfig.DEBUG) {
    console.log('Mongodb connection error: ' + err);
  }
});

mongoose.connection.on('disconnected', () => {
  if (appConfig.DEBUG) {
    console.log('Mongodb connection disconnected');
  }
});

// If the Node process ends, close the Mongoose connection
// process.on('SIGINT', function () {
//   mongoose.connection.close(function () {
//     console.log('Mongoose default connection disconnected through app termination');
//     process.exit(0);
//   });
// });
