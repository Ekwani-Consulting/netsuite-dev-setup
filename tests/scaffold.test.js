const { buildScaffoldArgs } = require('../lib/scaffold');

describe('buildScaffoldArgs', () => {
  test('builds the correct argument array', () => {
    const args = buildScaffoldArgs('my-project');
    expect(args).toEqual([
      'project:create',
      '--type', 'ACCOUNTCUSTOMIZATION',
      '--projectname', 'my-project',
    ]);
  });

  test('trims whitespace from project name', () => {
    const args = buildScaffoldArgs('  my-project  ');
    expect(args).toEqual([
      'project:create',
      '--type', 'ACCOUNTCUSTOMIZATION',
      '--projectname', 'my-project',
    ]);
  });
});
