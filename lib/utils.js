const { execFileSync } = require('child_process');
const chalk = require('chalk');

const isWindows = process.platform === 'win32';

function resolveCmd(command, args) {
  if (!isWindows) return { file: command, args: args };
  // Quote args with spaces so cmd.exe doesn't split them
  const quoted = args.map((a) => (a.includes(' ') ? `"${a}"` : a));
  return { file: process.env.ComSpec || 'cmd.exe', args: ['/c', command, ...quoted] };
}

function runCommand(command, args = [], options = {}) {
  const { cwd, ...rest } = options;
  const cmd = resolveCmd(command, args);
  try {
    const result = execFileSync(cmd.file, cmd.args, {
      encoding: 'utf-8',
      stdio: 'pipe',
      ...rest,
      cwd: cwd || process.cwd(),
    });
    return result || '';
  } catch (err) {
    throw new Error(err.stderr || err.message);
  }
}

function runCommandInherit(command, args = [], options = {}) {
  const cmd = resolveCmd(command, args);
  execFileSync(cmd.file, cmd.args, {
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
  const teal = chalk.bold.hex('#278575');
  console.log('');
  console.log(teal('  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510'));
  console.log(teal('  \u2502  Ekwani Consulting - NetSuite Setup     \u2502'));
  console.log(teal('  \u2502  This tool will set up your SuiteCloud  \u2502'));
  console.log(teal('  \u2502  development environment.               \u2502'));
  console.log(teal('  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518'));
  console.log('');
}

function printCompletionBox(lines) {
  if (!lines || lines.length === 0) return;
  const maxLen = Math.max(...lines.map((l) => l.length));
  const border = '\u2500'.repeat(maxLen + 4);
  console.log('');
  const teal = chalk.bold.hex('#278575');
  console.log(teal(`  \u250c${border}\u2510`));
  for (const line of lines) {
    const padded = line.padEnd(maxLen);
    console.log(teal(`  \u2502  ${padded}  \u2502`));
  }
  console.log(teal(`  \u2514${border}\u2518`));
  console.log('');
}

module.exports = {
  isWindows,
  resolveCmd,
  runCommand,
  runCommandInherit,
  printSuccess,
  printError,
  printInfo,
  printBanner,
  printCompletionBox,
};
