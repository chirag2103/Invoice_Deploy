import config from './config/index.js';

export default {
  mongodb: {
    url: config.MONGOURI,
    databaseName: undefined, // taken from the connection string
    options: {},
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'migrations_changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'esm',
};
