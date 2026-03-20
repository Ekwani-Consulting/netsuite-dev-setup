const { execFile } = require('child_process');
const inquirer = require('inquirer');
const { runCommand, printSuccess, printError, printInfo } = require('./utils');

const isWindows = process.platform === 'win32';
const CONCURRENCY = 10;

function importFile(filePath, projectPath) {
  return new Promise((resolve) => {
    const args = ['file:import', '--paths', filePath];
    let file, fileArgs;
    if (isWindows) {
      file = process.env.ComSpec || 'cmd.exe';
      fileArgs = ['/c', 'suitecloud', ...args.map((a) => (a.includes(' ') ? `"${a}"` : a))];
    } else {
      file = 'suitecloud';
      fileArgs = args;
    }
    execFile(file, fileArgs, { cwd: projectPath, encoding: 'utf-8' }, (err, stdout, stderr) => {
      resolve({ ok: !err, error: err ? (stderr || err.message) : null });
    });
  });
}

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
        printInfo(`Importing ${fileList.length} files (${CONCURRENCY} at a time)...`);
        let done = 0;
        let imported = 0;
        let failed = 0;

        for (let i = 0; i < fileList.length; i += CONCURRENCY) {
          const batch = fileList.slice(i, i + CONCURRENCY);
          const results = await Promise.all(
            batch.map((f) => importFile(f.trim(), projectPath))
          );
          for (let j = 0; j < results.length; j++) {
            done++;
            const name = batch[j].trim().split('/').pop();
            if (results[j].ok) {
              imported++;
              printSuccess(`(${done}/${fileList.length}) ${name}`);
            } else {
              failed++;
              printError(`(${done}/${fileList.length}) ${name} - ${results[j].error}`);
            }
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
