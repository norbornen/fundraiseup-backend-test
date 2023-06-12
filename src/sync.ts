import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

import { connect } from './db';
import { SyncReindexUsecase } from './sync/reindex.usecase';
import { SyncWatchUsecase } from './sync/watch.usecase';

connect()
  .then(async (connection) => {
    const argv = await parseArgv();

    try {
      if (argv.fullReindex === true) {
        const usecase = new SyncReindexUsecase();
        await usecase.runOnce();
      } else {
        const usecase = new SyncWatchUsecase();
        await usecase.run();
      }
      process.exitCode = 0;
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    }

    await connection.disconnect().catch(console.error);
    await connection.connection.close().catch(console.error);
    process.exit();

    return void 1;
  })
  .catch((err) => {
    console.error(err || new Error('CANT_MONGO_CONNECT'));
    process.exit(1);
  });

async function parseArgv() {
  const argv = await yargs(hideBin(process.argv))
    .option('fullReindex', {
      alias: ['full-reindex'],
      type: 'boolean',
      default: false,
    })
    .parse();
  return argv;
}
