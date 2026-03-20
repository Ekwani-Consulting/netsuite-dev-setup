const { execFileSync } = require('child_process');
const inquirer = require('inquirer');
const { runCommand, runCommandInherit, printSuccess, printError, printInfo } = require('./utils');

const isWindows = process.platform === 'win32';

function checkCommand(command, args) {
  try {
    const result = runCommand(command, args);
    return result.trim();
  } catch {
    return null;
  }
}

function checkCommandStderr(command, args) {
  try {
    const result = execFileSync(command, args, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows,
    });
    return (result || '').trim();
  } catch (err) {
    // Some commands (like java -version) write to stderr even on success
    if (err.stderr && err.status === null || err.stderr) {
      return err.stderr.trim();
    }
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

  // GitHub CLI - install if missing
  let ghInstalled = checkCommand('gh', ['--version']);
  if (ghInstalled) {
    printSuccess(`GitHub CLI ${ghInstalled.split('\n')[0]}`);
  } else {
    printError('GitHub CLI (gh) not found');
    const { installGh } = await inquirer.prompt([
      { type: 'confirm', name: 'installGh', message: 'Install GitHub CLI now?', default: true },
    ]);
    if (installGh) {
      printInfo('Installing GitHub CLI...');
      try {
        const platform = process.platform;
        if (platform === 'darwin') {
          runCommandInherit('brew', ['install', 'gh']);
        } else if (platform === 'win32') {
          try {
            runCommandInherit('winget', ['install', '--id', 'GitHub.cli', '--accept-source-agreements', '--accept-package-agreements']);
          } catch {
            // winget exits non-zero if already installed with no upgrade available - that's fine
          }
          // winget installs don't update PATH in the current session
          ghInstalled = checkCommand('gh', ['--version']);
          if (!ghInstalled) {
            console.log('');
            printSuccess('GitHub CLI is installed but not yet available in this terminal.');
            printInfo('Please close this terminal, open a new one, and run this command again:');
            console.log('');
            console.log('  npx github:Ekwani-Consulting/netsuite-dev-setup');
            console.log('');
            process.exit(0);
          }
        } else {
          printError('Auto-install not supported on this platform.');
          printInfo('Install manually from: https://cli.github.com');
          throw new Error('GitHub CLI is required but not installed.');
        }
        ghInstalled = checkCommand('gh', ['--version']);
        if (ghInstalled) {
          printSuccess(`GitHub CLI ${ghInstalled.split('\n')[0]}`);
        }
      } catch (err) {
        if (err.message === 'GitHub CLI is required but not installed.') throw err;
        printError('Failed to install GitHub CLI: ' + err.message);
        printInfo('Install manually from: https://cli.github.com');
        throw new Error('GitHub CLI is required but not installed.');
      }
    } else {
      printInfo('Install manually from: https://cli.github.com');
      throw new Error('GitHub CLI is required but not installed.');
    }
  }

  // GitHub auth - login if needed
  const ghAuthed = checkCommand('gh', ['auth', 'status']);
  if (!ghAuthed) {
    printInfo('You need to sign in to GitHub.');
    printInfo('A browser window will open - sign in with your Ekwani Consulting GitHub account.');
    console.log('');
    try {
      runCommandInherit('gh', ['auth', 'login', '--web', '--git-protocol', 'https']);
      printSuccess('GitHub authentication complete');
    } catch (err) {
      printError('GitHub login failed: ' + err.message);
      printInfo('Try running manually: gh auth login');
      throw new Error('GitHub authentication is required.');
    }
  } else {
    printSuccess('GitHub authenticated');
  }

  // Verify org membership
  try {
    const orgs = runCommand('gh', ['org', 'list']);
    if (!orgs.includes('Ekwani-Consulting')) {
      printError('Your GitHub account is not a member of the Ekwani-Consulting organization.');
      printInfo('Contact your team lead to get added to https://github.com/Ekwani-Consulting');
      throw new Error('Not a member of Ekwani-Consulting organization.');
    }
    printSuccess('Ekwani-Consulting org membership verified');
  } catch (err) {
    if (err.message === 'Not a member of Ekwani-Consulting organization.') throw err;
    printError('Could not verify org membership: ' + err.message);
    throw err;
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

  // Java - required by SuiteCloud CLI
  const java = checkCommandStderr('java', ['-version']);
  if (java) {
    printSuccess(`Java ${java.split('\n')[0]}`);
  } else {
    printError('Java not found (required by SuiteCloud CLI)');
    const { installJava } = await inquirer.prompt([
      { type: 'confirm', name: 'installJava', message: 'Install Oracle JDK 21 now?', default: true },
    ]);
    if (installJava) {
      printInfo('Installing Oracle JDK 21...');
      try {
        const platform = process.platform;
        if (platform === 'darwin') {
          runCommandInherit('brew', ['install', '--cask', 'oracle-jdk']);
        } else if (platform === 'win32') {
          try {
            runCommandInherit('winget', ['install', '--id', 'Oracle.JDK.21', '--accept-source-agreements', '--accept-package-agreements']);
          } catch {
            // winget may exit non-zero if already installed
          }
          const javaCheck = checkCommandStderr('java', ['-version']);
          if (!javaCheck) {
            console.log('');
            printSuccess('Oracle JDK installed but not yet available in this terminal.');
            printInfo('Please close this terminal, open a new one, and run this command again:');
            console.log('');
            console.log('  npx github:Ekwani-Consulting/netsuite-dev-setup');
            console.log('');
            process.exit(0);
          }
        } else {
          printInfo('Install Oracle JDK 17 or 21 from: https://www.oracle.com/java/technologies/downloads/');
          throw new Error('Java is required but not installed.');
        }
        const javaVersion = checkCommandStderr('java', ['-version']);
        if (javaVersion) {
          printSuccess(`Java ${javaVersion.split('\n')[0]}`);
        }
      } catch (err) {
        if (err.message === 'Java is required but not installed.') throw err;
        printError('Failed to install Java: ' + err.message);
        printInfo('Install Oracle JDK 17 or 21 from: https://www.oracle.com/java/technologies/downloads/');
        throw new Error('Java is required but not installed.');
      }
    } else {
      printInfo('Install Oracle JDK 17 or 21 from: https://www.oracle.com/java/technologies/downloads/');
      throw new Error('Java is required but not installed.');
    }
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
