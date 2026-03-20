const inquirer = require('inquirer');
const { runCommand, runCommandInherit, printSuccess, printError, printInfo } = require('./utils');

function getAuthGuidance() {
  return 'Your browser will open for NetSuite login. Complete the login, select your role, and click Allow. Then return here.';
}

async function runAuth(projectPath) {
  console.log('');

  const { setupNow } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupNow',
      message: 'Set up NetSuite account connection now?',
      default: true,
    },
  ]);

  if (!setupNow) {
    printInfo('You can set up the connection later by running: suitecloud account:setup');
    return false;
  }

  printInfo(getAuthGuidance());
  printInfo('Tip: The authentication ID is just a nickname (e.g. "sandbox" or "production").');
  console.log('');

  try {
    runCommandInherit('suitecloud', ['account:setup'], { cwd: projectPath });
    printSuccess('NetSuite account connected');
  } catch (err) {
    printError('Account setup failed: ' + err.message);
    printInfo('You can try again later by running: suitecloud account:setup');
    return false;
  }

  const { verify } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'verify',
      message: 'Verify connection by listing SuiteScript files?',
      default: true,
    },
  ]);

  if (verify) {
    try {
      const output = runCommand('suitecloud', ['file:list', '--folder', '/SuiteScripts'], { cwd: projectPath });
      const lines = output.trim().split('\n').filter((l) => l.trim().length > 0);
      printSuccess(`Connection verified -- found ${lines.length} files in /SuiteScripts`);
    } catch (err) {
      printError('Verification failed: ' + err.message);
      printInfo('The connection may still work. Try running: suitecloud file:list --folder "/SuiteScripts"');
    }
  }

  return true;
}

module.exports = { getAuthGuidance, runAuth };
