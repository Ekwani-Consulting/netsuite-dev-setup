const { runCommand, printSuccess, printError, printBanner } = require('../lib/utils');

describe('runCommand', () => {
  test('returns stdout for a successful command', () => {
    const result = runCommand('echo', ['hello']);
    expect(result.trim()).toBe('hello');
  });

  test('throws on a failed command', () => {
    expect(() => runCommand('command_that_does_not_exist_xyz', [])).toThrow();
  });
});

describe('printSuccess', () => {
  test('does not throw', () => {
    expect(() => printSuccess('test message')).not.toThrow();
  });
});

describe('printError', () => {
  test('does not throw', () => {
    expect(() => printError('test message')).not.toThrow();
  });
});

describe('printBanner', () => {
  test('does not throw', () => {
    expect(() => printBanner()).not.toThrow();
  });
});
