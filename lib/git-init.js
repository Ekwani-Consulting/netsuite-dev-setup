const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { runCommand, printSuccess, printError, printInfo } = require('./utils');

function getGitignoreContent() {
  return `node_modules/
.suitecloud-sdk/
suitecloud.config.js
DEVELOPER-GUIDE.docx
`;
}

function getGitInitArgs() {
  return ['init', '-b', 'main'];
}

async function runGitInit(projectPath) {
  console.log('');
  printInfo('Initializing Git repository...');

  try {
    runCommand('git', getGitInitArgs(), { cwd: projectPath });
    printSuccess('Git initialized');

    const gitignorePath = path.join(projectPath, '.gitignore');
    fs.writeFileSync(gitignorePath, getGitignoreContent());
    printSuccess('.gitignore created');

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
        printInfo('Installing project dependencies...');
        runCommand('npm', ['install'], { cwd: projectPath });
        printSuccess('Dependencies installed');
      }
    }

    runCommand('git', ['add', '.'], { cwd: projectPath });
    runCommand('git', ['commit', '-m', 'Initial project scaffold'], { cwd: projectPath });
    printSuccess('Initial commit created');

    const repoName = path.basename(projectPath);
    printInfo(`Creating private repo Ekwani-Consulting/${repoName} on GitHub...`);
    runCommand('gh', ['repo', 'create', `Ekwani-Consulting/${repoName}`, '--private', '--source', projectPath, '--remote', 'origin'], { cwd: projectPath });
    printSuccess(`GitHub repo created: Ekwani-Consulting/${repoName}`);

    const trimmedUrl = `https://github.com/Ekwani-Consulting/${repoName}.git`;

    let pushed = false;
    while (!pushed) {
      try {
        runCommand('git', ['push', '-u', 'origin', 'main'], { cwd: projectPath });
        pushed = true;
      } catch (pushErr) {
        printError('Push failed: ' + pushErr.message);
        const { retry } = await inquirer.prompt([
          { type: 'confirm', name: 'retry', message: 'Try pushing again?', default: true },
        ]);
        if (!retry) {
          printInfo('You can push later with: git push -u origin main');
          return trimmedUrl;
        }
      }
    }

    printSuccess(`Pushed to ${trimmedUrl}`);
    return trimmedUrl;
  } catch (err) {
    printError('Git setup failed: ' + err.message);
    throw err;
  }
}

module.exports = { getGitignoreContent, getGitInitArgs, runGitInit };
