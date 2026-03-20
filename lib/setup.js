const { printBanner, printCompletionBox } = require('./utils');
const { checkPrerequisites } = require('./prerequisites');
const { runScaffold } = require('./scaffold');
const { runAuth } = require('./auth');
const { runGitInit } = require('./git-init');

async function runSetup() {
  printBanner();
  await checkPrerequisites();
  const projectPath = await runScaffold();
  const connected = await runAuth(projectPath);
  const remoteUrl = await runGitInit(projectPath);

  const lines = [
    'Setup complete!',
    '',
    `Project: ${projectPath}`,
    `Connected: ${connected ? 'Yes' : 'No (run suitecloud account:setup later)'}`,
    `Remote: ${remoteUrl}`,
    '',
    'Next steps:',
    '1. Open the project folder in VS Code',
    '2. See DEVELOPER-GUIDE.md for import/deploy workflows',
  ];
  printCompletionBox(lines);
}

module.exports = { runSetup };
