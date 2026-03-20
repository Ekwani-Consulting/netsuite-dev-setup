const { checkCommand } = require('../lib/prerequisites');

describe('checkCommand', () => {
  test('returns version string for an installed command', () => {
    const result = checkCommand('node', ['--version']);
    expect(result).toMatch(/v\d+\.\d+/);
  });

  test('returns null for a missing command', () => {
    const result = checkCommand('command_that_does_not_exist_xyz', ['--version']);
    expect(result).toBeNull();
  });
});
