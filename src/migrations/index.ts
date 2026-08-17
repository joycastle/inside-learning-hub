import * as migration_20260817_033821_initial_schema from './20260817_033821_initial_schema';

export const migrations = [
  {
    up: migration_20260817_033821_initial_schema.up,
    down: migration_20260817_033821_initial_schema.down,
    name: '20260817_033821_initial_schema'
  },
];
