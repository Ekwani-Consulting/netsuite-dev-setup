const { checkCommand, checkPrerequisites } = require('../lib/prerequisites');

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

describe('checkPrerequisites', () => {
  test('returns an object with node, npm, git keys', async () => {
    const result = await checkPrerequisites();
    expect(result).toHaveProperty('node');
    expect(result).toHaveProperty('npm');
    expect(result).toHaveProperty('git');
    expect(result).toHaveProperty('suitecloud');
  });
});
