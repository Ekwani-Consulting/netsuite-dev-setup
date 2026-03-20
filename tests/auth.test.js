const { getAuthGuidance } = require('../lib/auth');

describe('getAuthGuidance', () => {
  test('returns guidance string', () => {
    const guidance = getAuthGuidance();
    expect(guidance).toContain('browser');
    expect(guidance).toContain('NetSuite');
  });
});
