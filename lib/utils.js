const { execFileSync } = require('child_process');
const chalk = require('chalk');

function runCommand(command, args = [], options = {}) {
  try {
    const result = execFileSync(command, args, {
      encoding: 'utf-8',
      cwd: options.cwd || process.cwd(),
      stdio: 'pipe',
      ...options,
    });
    return result || '';
  } catch (err) {
    throw new Error(err.stderr || err.message);
  }
}

function runCommandInherit(command, args = [], options = {}) {
  execFileSync(command, args, {
    stdio: 'inherit',
    cwd: options.cwd || process.cwd(),
    ...options,
  });
}

function printSuccess(message) {
  console.log(chalk.green('  \u2713 ') + message);
}

function printError(message) {
  console.log(chalk.red('  \u2717 ') + message);
}

function printInfo(message) {
  console.log(chalk.cyan('  \u2139 ') + message);
}

function printBanner() {
  console.log('');
  console.log(chalk.bold.cyan('  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510'));
  console.log(chalk.bold.cyan('  \u2502  Ekwani Consulting - NetSuite Setup     \u2502'));
  console.log(chalk.bold.cyan('  \u2502  This tool will set up your SuiteCloud  \u2502'));
  console.log(chalk.bold.cyan('  \u2502  development environment.               \u2502'));
  console.log(chalk.bold.cyan('  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518'));
  console.log('');
}

function printCompletionBox(lines) {
  const maxLen = Math.max(...lines.map((l) => l.length));
  const border = '\u2500'.repeat(maxLen + 4);
  console.log('');
  console.log(chalk.bold.green(`  \u250c${border}\u2510`));
  for (const line of lines) {
    const padded = line.padEnd(maxLen);
    console.log(chalk.bold.green(`  \u2502  ${padded}  \u2502`));
  }
  console.log(chalk.bold.green(`  \u2514${border}\u2518`));
  console.log('');
}

module.exports = {
  runCommand,
  runCommandInherit,
  printSuccess,
  printError,
  printInfo,
  printBanner,
  printCompletionBox,
};
