import 'dotenv/config';

import { IAppConfig } from '../common/interfaces';

export const appConfig: IAppConfig = {
  DB_URI: process.env.DB_URI,
  DB_NAME: 'fundraiseup-backend-test',
  DEBUG: [1, '1', true, 'true'].includes(process.env.DEBUG || ''),
};
