const inquirer = require('inquirer');
const { runCommand, printSuccess, printError, printInfo } = require('./utils');

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
        printInfo(`Importing ${fileList.length} files...`);
        let imported = 0;
        let failed = 0;
        for (const filePath of fileList) {
          const name = filePath.trim().split('/').pop();
          try {
            runCommand('suitecloud', ['file:import', '--paths', filePath.trim()], { cwd: projectPath });
            imported++;
            printSuccess(`(${imported + failed}/${fileList.length}) ${name}`);
          } catch {
            failed++;
            printError(`(${imported + failed}/${fileList.length}) ${name} - failed`);
          }
        }
        printSuccess(`Imported ${imported} of ${fileList.length} files`);
        if (failed > 0) {
          printInfo(`${failed} files could not be imported`);
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
