const inquirer = require('inquirer');
const { runCommand, runCommandInherit, printSuccess, printError, printInfo } = require('./utils');

async function runImport(projectPath) {
  console.log('');

  const { importNow } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'importNow',
      message: 'Import existing scripts from NetSuite now?',
      default: true,
    },
  ]);

  if (!importNow) {
    printInfo('You can import later using suitecloud file:import');
    return false;
  }

  // Import SuiteScript files
  printInfo('Listing files in /SuiteScripts...');
  try {
    const files = runCommand('suitecloud', ['file:list', '--folder', '/SuiteScripts'], { cwd: projectPath });
    const fileList = files.trim().split('\n').filter((l) => l.trim().length > 0);
    if (fileList.length > 0) {
      printSuccess(`Found ${fileList.length} files in /SuiteScripts`);
      const { importFiles } = await inquirer.prompt([
        { type: 'confirm', name: 'importFiles', message: `Import all ${fileList.length} script files?`, default: true },
      ]);
      if (importFiles) {
        printInfo('Importing script files...');
        try {
          runCommandInherit('suitecloud', ['file:import', '--paths', ...fileList], { cwd: projectPath });
          printSuccess('Script files imported');
        } catch (err) {
          printError('File import failed: ' + err.message);
          printInfo('You can import manually later: suitecloud file:import --paths "/SuiteScripts/..."');
        }
      }
    } else {
      printInfo('No files found in /SuiteScripts');
    }
  } catch (err) {
    printError('Could not list files: ' + err.message);
    printInfo('You can import manually later: suitecloud file:list --folder "/SuiteScripts"');
  }


  return true;
}

module.exports = { runImport };
