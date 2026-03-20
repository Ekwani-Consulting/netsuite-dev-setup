const fs = require('fs');
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

  const targetDir = process.cwd();
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

  const guideSrc = path.join(__dirname, '..', 'assets', 'DEVELOPER-GUIDE.docx');
  const guideDest = path.join(projectPath, 'DEVELOPER-GUIDE.docx');
  fs.copyFileSync(guideSrc, guideDest);
  printSuccess('DEVELOPER-GUIDE.docx added to project');

  printSuccess(`Project created at ${projectPath}`);
  return projectPath;
}

module.exports = { buildScaffoldArgs, runScaffold };
