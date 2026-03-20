const { printBanner, printCompletionBox } = require('./utils');
const { checkPrerequisites } = require('./prerequisites');
const { runScaffold } = require('./scaffold');
const { runAuth } = require('./auth');
const { runImport } = require('./import');
const { runGitInit } = require('./git-init');

async function runSetup() {
  printBanner();
  await checkPrerequisites();
  const projectPath = await runScaffold();
  const connected = await runAuth(projectPath);
  if (connected) {
    await runImport(projectPath);
  }
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
    '2. Open DEVELOPER-GUIDE.docx for import/deploy workflows',
  ];
  printCompletionBox(lines);
}

module.exports = { runSetup };
