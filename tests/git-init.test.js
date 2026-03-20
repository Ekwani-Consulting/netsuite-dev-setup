const { getGitignoreContent, getGitInitArgs } = require('../lib/git-init');

describe('getGitignoreContent', () => {
  test('includes node_modules', () => {
    expect(getGitignoreContent()).toContain('node_modules/');
  });

  test('includes suitecloud config', () => {
    expect(getGitignoreContent()).toContain('suitecloud.config.js');
  });

  test('includes suitecloud sdk dir', () => {
    expect(getGitignoreContent()).toContain('.suitecloud-sdk/');
  });
});

describe('getGitInitArgs', () => {
  test('returns args that force main branch', () => {
    const args = getGitInitArgs();
    expect(args).toEqual(['init', '-b', 'main']);
  });
});
