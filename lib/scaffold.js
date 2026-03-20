const path = require('path');
const inquirer = require('inquirer');
const { runCommandInherit, printSuccess, printError, printInfo } = require('./utils');

function buildScaffoldArgs(projectName) {
  return [
    'project:create',
    '--type', 'ACCOUNTCUSTOMIZATION',
    '--projectname', projectName.trim(),
  ];
}

async function runScaffold() {
  console.log('');

  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      validate: (input) => input.trim().length > 0 || 'Project name cannot be empty',
    },
  ]);

  const { directory } = await inquirer.prompt([
    {
      type: 'input',
      name: 'directory',
      message: 'Create in directory:',
      default: process.cwd(),
    },
  ]);

  const targetDir = path.resolve(directory);
  const args = buildScaffoldArgs(projectName);

  printInfo(`Creating project in ${targetDir}...`);

  let success = false;
  while (!success) {
    try {
      runCommandInherit('suitecloud', args, { cwd: targetDir });
      success = true;
    } catch (err) {
      printError('Failed to create project: ' + err.message);
      const { retry } = await inquirer.prompt([
        { type: 'confirm', name: 'retry', message: 'Try again?', default: true },
      ]);
      if (!retry) throw err;
    }
  }

  const projectPath = path.join(targetDir, projectName.trim());
  printSuccess(`Project created at ${projectPath}`);
  return projectPath;
}

module.exports = { buildScaffoldArgs, runScaffold };
