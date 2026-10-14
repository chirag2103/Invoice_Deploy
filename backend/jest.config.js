/** @type {import('jest').Config} */
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000,
  // Backend uses ESM ("type": "module") — run via:
  //   node --experimental-vm-modules node_modules/.bin/jest
  // (wired up as the `test` script in package.json).
};
