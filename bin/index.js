#!/usr/bin/env node

const { runSetup } = require('../lib/setup');

runSetup().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
