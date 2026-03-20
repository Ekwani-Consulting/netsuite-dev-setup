const inquirer = require('inquirer');
const { runCommand, runCommandInherit, printSuccess, printError, printInfo } = require('./utils');

function checkCommand(command, args) {
  try {
    const result = runCommand(command, args);
    return result.trim();
  } catch {
    return null;
  }
}

async function checkPrerequisites() {
  console.log('');
  console.log('  Checking prerequisites...');
  console.log('');

  const results = {
    node: checkCommand('node', ['--version']),
    npm: checkCommand('npm', ['--version']),
    git: checkCommand('git', ['--version']),
    suitecloud: checkCommand('suitecloud', ['--version']),
  };

  if (results.node) {
    printSuccess(`Node.js ${results.node}`);
  } else {
    printError('Node.js not found');
    printInfo('Download from: https://nodejs.org (LTS version)');
    throw new Error('Node.js is required but not installed.');
  }

  if (results.npm) {
    printSuccess(`npm v${results.npm}`);
  } else {
    printError('npm not found');
    printInfo('npm comes with Node.js. Reinstall Node.js from https://nodejs.org');
    throw new Error('npm is required but not installed.');
  }

  if (results.git) {
    printSuccess(`${results.git}`);
  } else {
    printError('Git not found');
    printInfo('Download from: https://git-scm.com');
    throw new Error('Git is required but not installed.');
  }

  if (results.suitecloud) {
    printSuccess(`SuiteCloud CLI ${results.suitecloud}`);
  } else {
    printError('SuiteCloud CLI not found');
    const { install } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'install',
        message: 'Install SuiteCloud CLI now?',
        default: true,
      },
    ]);
    if (install) {
      printInfo('Installing SuiteCloud CLI (this may take a minute)...');
      try {
        runCommandInherit('npm', ['install', '-g', '--acceptSuiteCloudSDKLicense', '@oracle/suitecloud-cli']);
        const version = checkCommand('suitecloud', ['--version']);
        printSuccess(`SuiteCloud CLI ${version}`);
        results.suitecloud = version;
      } catch (err) {
        printError('Failed to install SuiteCloud CLI: ' + err.message);
        printInfo('Try running manually: npm install -g --acceptSuiteCloudSDKLicense @oracle/suitecloud-cli');
        throw new Error('Failed to install SuiteCloud CLI.');
      }
    } else {
      printInfo('You can install it later: npm install -g --acceptSuiteCloudSDKLicense @oracle/suitecloud-cli');
      throw new Error('SuiteCloud CLI is required but not installed.');
    }
  }

  return results;
}

module.exports = { checkCommand, checkPrerequisites };
