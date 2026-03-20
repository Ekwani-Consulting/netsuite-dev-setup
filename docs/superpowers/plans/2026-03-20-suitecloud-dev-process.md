# SuiteCloud Dev Process Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive Node.js CLI setup tool and a comprehensive developer reference guide for NetSuite SuiteCloud development using VS Code and Git.

**Architecture:** Two deliverables in a single repo: (1) a Node.js CLI tool (`bin/index.js` entry point, `lib/` modules) that walks beginners through project setup, and (2) a `DEVELOPER-GUIDE.md` covering daily workflows. The CLI uses `inquirer` for prompts and `chalk` for colored output, delegating to shell commands via `child_process.execFileSync` (avoids shell injection by using argument arrays).

**Tech Stack:** Node.js, inquirer, chalk, child_process (built-in)

**Spec:** `docs/superpowers/specs/2026-03-20-suitecloud-dev-process-design.md`

---

## Chunk 1: Project Scaffolding & Utilities

### Task 1: Initialize the npm package

**Files:**
- Create: `package.json`
- Create: `bin/index.js`
- Create: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "netsuite-setup",
  "version": "1.0.0",
  "description": "Interactive CLI to scaffold a NetSuite SuiteCloud development environment",
  "bin": {
    "netsuite-setup": "./bin/index.js"
  },
  "dependencies": {
    "chalk": "^4.1.2",
    "inquirer": "^8.2.6"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "license": "UNLICENSED",
  "private": true
}
```

Note: Using chalk v4 and inquirer v8 (CommonJS). Versions 5+ of both packages are ESM-only, which adds complexity for no benefit here.

- [ ] **Step 2: Create `bin/index.js` entry point (minimal)**

```js
#!/usr/bin/env node

const { runSetup } = require('../lib/setup');

runSetup().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
```

- [ ] **Step 4: Run `npm install`**

Run: `npm install`
Expected: `node_modules/` created, `package-lock.json` generated with chalk and inquirer installed.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json bin/index.js .gitignore
git commit -m "Initialize netsuite-setup package with entry point"
```

---

### Task 2: Build the utils module

**Files:**
- Create: `lib/utils.js`

- [ ] **Step 1: Write the failing test**

Create `tests/utils.test.js`:

```js
const { runCommand, printSuccess, printError, printBanner } = require('../lib/utils');

describe('runCommand', () => {
  test('returns stdout for a successful command', () => {
    const result = runCommand('echo', ['hello']);
    expect(result.trim()).toBe('hello');
  });

  test('throws on a failed command', () => {
    expect(() => runCommand('command_that_does_not_exist_xyz', [])).toThrow();
  });
});

describe('printSuccess', () => {
  test('does not throw', () => {
    expect(() => printSuccess('test message')).not.toThrow();
  });
});

describe('printError', () => {
  test('does not throw', () => {
    expect(() => printError('test message')).not.toThrow();
  });
});

describe('printBanner', () => {
  test('does not throw', () => {
    expect(() => printBanner()).not.toThrow();
  });
});
```

- [ ] **Step 2: Install jest and run test to verify it fails**

Run: `npm install --save-dev jest && npx jest tests/utils.test.js`
Expected: FAIL -- `Cannot find module '../lib/utils'`

- [ ] **Step 3: Write `lib/utils.js`**

Uses `execFileSync` with argument arrays to avoid shell injection:

```js
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
  console.log(chalk.green('  ✓ ') + message);
}

function printError(message) {
  console.log(chalk.red('  ✗ ') + message);
}

function printInfo(message) {
  console.log(chalk.cyan('  ℹ ') + message);
}

function printBanner() {
  console.log('');
  console.log(chalk.bold.cyan('  ┌─────────────────────────────────────────┐'));
  console.log(chalk.bold.cyan('  │  Ekwani Consulting - NetSuite Setup     │'));
  console.log(chalk.bold.cyan('  │  This tool will set up your SuiteCloud  │'));
  console.log(chalk.bold.cyan('  │  development environment.               │'));
  console.log(chalk.bold.cyan('  └─────────────────────────────────────────┘'));
  console.log('');
}

function printCompletionBox(lines) {
  const maxLen = Math.max(...lines.map((l) => l.length));
  const border = '─'.repeat(maxLen + 4);
  console.log('');
  console.log(chalk.bold.green(`  ┌${border}┐`));
  for (const line of lines) {
    const padded = line.padEnd(maxLen);
    console.log(chalk.bold.green(`  │  ${padded}  │`));
  }
  console.log(chalk.bold.green(`  └${border}┘`));
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/utils.test.js`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/utils.js tests/utils.test.js package.json package-lock.json
git commit -m "Add utils module with shell runner and print helpers"
```

---

### Task 3: Build the prerequisites module

**Files:**
- Create: `lib/prerequisites.js`
- Create: `tests/prerequisites.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/prerequisites.test.js`:

```js
const { checkCommand, checkPrerequisites } = require('../lib/prerequisites');

describe('checkCommand', () => {
  test('returns version string for an installed command', () => {
    const result = checkCommand('node', ['--version']);
    expect(result).toMatch(/v\d+\.\d+/);
  });

  test('returns null for a missing command', () => {
    const result = checkCommand('command_that_does_not_exist_xyz', ['--version']);
    expect(result).toBeNull();
  });
});

describe('checkPrerequisites', () => {
  test('returns an object with node, npm, git keys', () => {
    const result = checkPrerequisites();
    expect(result).toHaveProperty('node');
    expect(result).toHaveProperty('npm');
    expect(result).toHaveProperty('git');
    expect(result).toHaveProperty('suitecloud');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/prerequisites.test.js`
Expected: FAIL -- `Cannot find module '../lib/prerequisites'`

- [ ] **Step 3: Write `lib/prerequisites.js`**

```js
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

function checkPrerequisites() {
  console.log('');
  console.log('  Checking prerequisites...');
  console.log('');

  const results = {
    node: checkCommand('node', ['--version']),
    npm: checkCommand('npm', ['--version']),
    git: checkCommand('git', ['--version']),
    suitecloud: checkCommand('suitecloud', ['--version']),
  };

  // Node.js
  if (results.node) {
    printSuccess(`Node.js ${results.node}`);
  } else {
    printError('Node.js not found');
    printInfo('Download from: https://nodejs.org (LTS version)');
    process.exit(1);
  }

  // npm
  if (results.npm) {
    printSuccess(`npm v${results.npm}`);
  } else {
    printError('npm not found');
    printInfo('npm comes with Node.js. Reinstall Node.js from https://nodejs.org');
    process.exit(1);
  }

  // Git
  if (results.git) {
    printSuccess(`${results.git}`);
  } else {
    printError('Git not found');
    printInfo('Download from: https://git-scm.com');
    process.exit(1);
  }

  // SuiteCloud CLI
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
        process.exit(1);
      }
    } else {
      printInfo('You can install it later: npm install -g --acceptSuiteCloudSDKLicense @oracle/suitecloud-cli');
      process.exit(1);
    }
  }

  return results;
}

module.exports = { checkCommand, checkPrerequisites };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/prerequisites.test.js`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/prerequisites.js tests/prerequisites.test.js
git commit -m "Add prerequisites module to check and install dependencies"
```

---

## Chunk 2: Core Setup Modules

### Task 4: Build the scaffold module

**Files:**
- Create: `lib/scaffold.js`
- Create: `tests/scaffold.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/scaffold.test.js`:

```js
const { buildScaffoldArgs } = require('../lib/scaffold');

describe('buildScaffoldArgs', () => {
  test('builds the correct argument array', () => {
    const args = buildScaffoldArgs('my-project');
    expect(args).toEqual([
      'project:create',
      '--type', 'ACCOUNTCUSTOMIZATION',
      '--projectname', 'my-project',
    ]);
  });

  test('trims whitespace from project name', () => {
    const args = buildScaffoldArgs('  my-project  ');
    expect(args).toEqual([
      'project:create',
      '--type', 'ACCOUNTCUSTOMIZATION',
      '--projectname', 'my-project',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/scaffold.test.js`
Expected: FAIL -- `Cannot find module '../lib/scaffold'`

- [ ] **Step 3: Write `lib/scaffold.js`**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/scaffold.test.js`
Expected: All 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/scaffold.js tests/scaffold.test.js
git commit -m "Add scaffold module to create ACP projects"
```

---

### Task 5: Build the auth module

**Files:**
- Create: `lib/auth.js`
- Create: `tests/auth.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/auth.test.js`:

```js
const { getAuthGuidance } = require('../lib/auth');

describe('getAuthGuidance', () => {
  test('returns guidance string', () => {
    const guidance = getAuthGuidance();
    expect(guidance).toContain('browser');
    expect(guidance).toContain('NetSuite');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/auth.test.js`
Expected: FAIL -- `Cannot find module '../lib/auth'`

- [ ] **Step 3: Write `lib/auth.js`**

```js
const inquirer = require('inquirer');
const { runCommand, runCommandInherit, printSuccess, printError, printInfo } = require('./utils');

function getAuthGuidance() {
  return 'Your browser will open for NetSuite login. Complete the login, select your role, and click Allow. Then return here.';
}

async function runAuth(projectPath) {
  console.log('');

  const { setupNow } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'setupNow',
      message: 'Set up NetSuite account connection now?',
      default: true,
    },
  ]);

  if (!setupNow) {
    printInfo('You can set up the connection later by running: suitecloud account:setup');
    return false;
  }

  const { authId } = await inquirer.prompt([
    {
      type: 'input',
      name: 'authId',
      message: 'Suggested authentication ID (a nickname for this connection):',
      default: 'sandbox',
    },
  ]);

  printInfo(getAuthGuidance());
  printInfo(`Tip: When prompted for an authentication ID, use "${authId.trim()}"`);
  console.log('');

  try {
    runCommandInherit('suitecloud', ['account:setup'], { cwd: projectPath });
    printSuccess('NetSuite account connected');
  } catch (err) {
    printError('Account setup failed: ' + err.message);
    printInfo('You can try again later by running: suitecloud account:setup');
    return false;
  }

  // Verify connection
  const { verify } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'verify',
      message: 'Verify connection by listing SuiteScript files?',
      default: true,
    },
  ]);

  if (verify) {
    try {
      const output = runCommand('suitecloud', ['file:list', '--folder', '/SuiteScripts'], { cwd: projectPath });
      const lines = output.trim().split('\n').filter((l) => l.trim().length > 0);
      printSuccess(`Connection verified -- found ${lines.length} files in /SuiteScripts`);
    } catch (err) {
      printError('Verification failed: ' + err.message);
      printInfo('The connection may still work. Try running: suitecloud file:list --folder "/SuiteScripts"');
    }
  }

  return true;
}

module.exports = { getAuthGuidance, runAuth };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/auth.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/auth.js tests/auth.test.js
git commit -m "Add auth module to handle NetSuite OAuth setup"
```

---

### Task 6: Build the git-init module

**Files:**
- Create: `lib/git-init.js`
- Create: `tests/git-init.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/git-init.test.js`:

```js
const { getGitignoreContent, getGitInitArgs } = require('../lib/git-init');

describe('getGitignoreContent', () => {
  test('includes node_modules', () => {
    expect(getGitignoreContent()).toContain('node_modules/');
  });

  test('includes suitecloud config', () => {
    expect(getGitignoreContent()).toContain('suitecloud.config.js');
  });

  test('includes suitecloud sdk dir', () => {
    expect(getGitignoreContent()).toContain('.suitecloud-sdk/');
  });
});

describe('getGitInitArgs', () => {
  test('returns args that force main branch', () => {
    const args = getGitInitArgs();
    expect(args).toEqual(['init', '-b', 'main']);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest tests/git-init.test.js`
Expected: FAIL -- `Cannot find module '../lib/git-init'`

- [ ] **Step 3: Write `lib/git-init.js`**

```js
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const { runCommand, printSuccess, printError, printInfo } = require('./utils');

function getGitignoreContent() {
  return `node_modules/
.suitecloud-sdk/
suitecloud.config.js
`;
}

function getGitInitArgs() {
  return ['init', '-b', 'main'];
}

async function runGitInit(projectPath) {
  console.log('');
  printInfo('Initializing Git repository...');

  try {
    // git init -b main
    runCommand('git', getGitInitArgs(), { cwd: projectPath });
    printSuccess('Git initialized');

    // .gitignore
    const gitignorePath = path.join(projectPath, '.gitignore');
    fs.writeFileSync(gitignorePath, getGitignoreContent());
    printSuccess('.gitignore created');

    // npm install if package.json has dependencies
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
        printInfo('Installing project dependencies...');
        runCommand('npm', ['install'], { cwd: projectPath });
        printSuccess('Dependencies installed');
      }
    }

    // first commit
    runCommand('git', ['add', '.'], { cwd: projectPath });
    runCommand('git', ['commit', '-m', 'Initial project scaffold'], { cwd: projectPath });
    printSuccess('Initial commit created');

    // remote
    const { remoteUrl } = await inquirer.prompt([
      {
        type: 'input',
        name: 'remoteUrl',
        message: 'Remote repository URL (e.g., https://github.com/ekwani/my-project.git):',
        validate: (input) => input.trim().length > 0 || 'Remote URL cannot be empty',
      },
    ]);

    const trimmedUrl = remoteUrl.trim();
    runCommand('git', ['remote', 'add', 'origin', trimmedUrl], { cwd: projectPath });

    // Push with retry (most likely failure point -- remote may not exist yet)
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest tests/git-init.test.js`
Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/git-init.js tests/git-init.test.js
git commit -m "Add git-init module for repo setup and first commit"
```

---

## Chunk 3: Main Setup Flow & Integration

### Task 7: Build the main setup orchestrator

**Files:**
- Create: `lib/setup.js`

- [ ] **Step 1: Write `lib/setup.js`**

This is the orchestrator that wires all modules together in sequence:

```js
const { printBanner, printCompletionBox } = require('./utils');
const { checkPrerequisites } = require('./prerequisites');
const { runScaffold } = require('./scaffold');
const { runAuth } = require('./auth');
const { runGitInit } = require('./git-init');

async function runSetup() {
  // Stage 1: Welcome
  printBanner();

  // Stage 2: Prerequisites
  await checkPrerequisites();

  // Stage 3: Scaffold
  const projectPath = await runScaffold();

  // Stage 4: Authentication
  const connected = await runAuth(projectPath);

  // Stage 5: Git
  const remoteUrl = await runGitInit(projectPath);

  // Completion
  const lines = [
    'Setup complete!',
    '',
    `Project: ${projectPath}`,
    `Connected: ${connected ? 'Yes' : 'No (run suitecloud account:setup later)'}`,
    `Remote: ${remoteUrl}`,
    '',
    'Next steps:',
    '1. Open the project folder in VS Code',
    '2. See DEVELOPER-GUIDE.md for import/deploy workflows',
  ];
  printCompletionBox(lines);
}

module.exports = { runSetup };
```

- [ ] **Step 2: Verify the entry point wiring**

Read `bin/index.js` and confirm it requires `../lib/setup` and calls `runSetup()`. This was created in Task 1.

- [ ] **Step 3: Add a test script to `package.json`**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: All tests across all test files PASS.

- [ ] **Step 5: Test the CLI invocation locally**

Run: `node bin/index.js`
Expected: The welcome banner displays, prerequisite checks run. You can Ctrl+C after verifying the flow starts correctly (full end-to-end requires a NetSuite account).

- [ ] **Step 6: Commit**

```bash
git add lib/setup.js package.json
git commit -m "Add main setup orchestrator wiring all stages together"
```

---

### Task 8: Verify package configuration for npx

**Files:**
- Verify: `package.json` (bin field points to `./bin/index.js`)

- [ ] **Step 1: Verify `package.json` bin field**

Read `package.json` and confirm:
```json
"bin": {
  "netsuite-setup": "./bin/index.js"
}
```

This is what allows `npx` to find and execute the tool.

- [ ] **Step 2: Verify `bin/index.js` has the shebang line**

Read `bin/index.js` and confirm the first line is:
```
#!/usr/bin/env node
```

- [ ] **Step 3: Make `bin/index.js` executable**

Run: `chmod +x bin/index.js`

- [ ] **Step 4: Test npx local invocation**

Run: `npx .`
Expected: Same behavior as `node bin/index.js` -- banner displays, prerequisites check runs.

- [ ] **Step 5: Commit**

```bash
git add bin/index.js
git commit -m "Make bin/index.js executable for npx invocation"
```

---

## Chunk 4: Developer Reference Guide

### Task 9: Write DEVELOPER-GUIDE.md -- Phase 0 and Importing

**Files:**
- Create: `DEVELOPER-GUIDE.md`

- [ ] **Step 1: Write Phase 0 and Importing sections**

Create `DEVELOPER-GUIDE.md` with the following content:

```markdown
# Ekwani Consulting -- NetSuite Developer Guide

This guide walks you through setting up your NetSuite development environment and the daily workflow for importing, editing, and deploying scripts and customizations.

---

## Table of Contents

1. [Phase 0: Running the Setup Tool](#phase-0-running-the-setup-tool)
2. [Importing from NetSuite](#importing-from-netsuite)
3. [Pushing to NetSuite](#pushing-to-netsuite)
4. [Git Workflow -- Terminal](#git-workflow----terminal)
5. [Git Workflow -- GitHub Desktop](#git-workflow----github-desktop)
6. [Quick Reference](#quick-reference)
7. [Joining an Existing Project](#joining-an-existing-project)
8. [Rollback Guidance](#rollback-guidance)

---

## Phase 0: Running the Setup Tool

The setup tool automates the entire first-time setup process. Follow these steps carefully.

### Step 1: Open Your Terminal

**On macOS:**
- Open **Finder** > **Applications** > **Utilities** > **Terminal**
- Or press **Cmd + Space**, type "Terminal", and press Enter

**On Windows:**
- Press **Windows key**, type "PowerShell", and press Enter
- Or press **Windows key + R**, type `cmd`, and press Enter

### Step 2: Navigate to Your Projects Folder

Type the following and press Enter:

```bash
cd ~/Projects
```

This moves you to a "Projects" folder in your home directory. If this folder doesn't exist yet, create it first:

```bash
mkdir ~/Projects
cd ~/Projects
```

### Step 3: Make Sure You Have GitHub Access

Since the setup tool lives in a private repository, your computer needs to be authenticated with GitHub. The easiest way:

1. **Download and install GitHub Desktop** from https://desktop.github.com
2. **Sign in** with your GitHub account (the one that has access to the Ekwani Consulting organization)
3. That's it -- signing into GitHub Desktop automatically sets up your Git credentials

### Step 4: Run the Setup Tool

Type the following command and press Enter:

```bash
npx github:ekwani-consulting/netsuite-setup
```

**What to expect:**

1. **Welcome screen** -- You'll see a banner that says "Ekwani Consulting - NetSuite Setup"
2. **Prerequisite checks** -- The tool checks if Node.js, npm, Git, and SuiteCloud CLI are installed
   - If SuiteCloud CLI is missing, it will ask: "Install SuiteCloud CLI now?" -- type **Y** and press Enter
3. **Project name** -- Type a name for your project (e.g., `my-netsuite-project`) and press Enter
4. **Directory** -- Press Enter to use the current folder, or type a different path
5. **NetSuite login** -- The tool will ask to set up your NetSuite connection
   - Your web browser will open automatically to the NetSuite login page
   - Log in with your NetSuite credentials
   - Select your role (must have SuiteCloud Developer permissions)
   - Click **Allow** to authorize the connection
   - Go back to your terminal -- it should show a success message
6. **Git setup** -- The tool creates a Git repository and asks for your remote URL
   - Paste the GitHub repository URL your team lead provided (e.g., `https://github.com/ekwani/my-project.git`)

### Troubleshooting

| Problem | Solution |
|---------|----------|
| "npx: command not found" | Node.js is not installed. Download from https://nodejs.org |
| "Permission denied" or "Repository not found" | Your GitHub account doesn't have access. Ask your team lead to add you to the Ekwani Consulting organization |
| Browser didn't open during NetSuite login | Copy the URL from the terminal and paste it into your browser manually |
| "Role doesn't have permissions" | Ask your NetSuite admin to enable SuiteCloud Developer permissions on your role |

---

## Importing from NetSuite

After setup, you'll want to pull existing scripts and customizations from NetSuite into your local project. Open the terminal in VS Code (**Ctrl + `** or **Terminal > New Terminal**) and make sure you're inside your project folder.

### See What Files Exist in NetSuite

```bash
suitecloud file:list --folder "/SuiteScripts"
```

This lists all script files in your NetSuite account's SuiteScripts folder. Use this to find the files you want to import.

### Import a Specific Script File

```bash
suitecloud file:import --paths "/SuiteScripts/my_script.js"
```

Replace `/SuiteScripts/my_script.js` with the actual path from the list above. The file will be downloaded into your project's `src/FileCabinet/SuiteScripts/` folder.

To import multiple files at once:

```bash
suitecloud file:import --paths "/SuiteScripts/script1.js" "/SuiteScripts/script2.js"
```

### See What Custom Objects Exist

```bash
suitecloud object:list --type ALL
```

This lists custom records, fields, workflows, and other customizations in your account.

### Import All Custom Objects

```bash
suitecloud object:import --destinationfolder "/Objects" --type ALL --scriptid ALL
```

This downloads all custom objects into your project's `src/Objects/` folder as XML files.

### Save Your Imports to Git

After importing, always commit your changes:

```bash
git add .
git commit -m "Import existing scripts from NetSuite"
git push
```

This saves everything to your Git repository so your teammates can see it too.
```

- [ ] **Step 2: Commit**

```bash
git add DEVELOPER-GUIDE.md
git commit -m "Add Developer Guide: Phase 0 setup and importing sections"
```

---

### Task 10: Write DEVELOPER-GUIDE.md -- Pushing and Git Workflows

**Files:**
- Modify: `DEVELOPER-GUIDE.md`

- [ ] **Step 1: Append the Pushing to NetSuite and Git Workflow sections**

Add to the end of `DEVELOPER-GUIDE.md`:

```markdown
---

## Pushing to NetSuite

When you've made changes locally and want to send them to the NetSuite sandbox, you have three options depending on the situation.

### Upload a Single Script File

Use this for quick changes to one script:

```bash
suitecloud file:upload --paths "/FileCabinet/SuiteScripts/my_script.js"
```

**Important:** Notice the path starts with `/FileCabinet/` -- this is different from importing. Upload paths are relative to your project's `src/` folder. Import paths are relative to NetSuite's File Cabinet.

### Push a Single Custom Object

Use this when you've changed one custom record, field, or workflow:

```bash
suitecloud object:update --scriptid customrecord_myrecord
```

Replace `customrecord_myrecord` with the actual script ID of the object you changed.

### Deploy the Entire Project

Use this for bigger changes that involve multiple files and objects:

```bash
suitecloud project:deploy
```

This deploys everything listed in your `deploy.xml` file to the sandbox.

**Warning:** Since everyone shares the same sandbox, let your team know before running `project:deploy`. A quick message in your team chat prevents surprises.

---

## Git Workflow -- Terminal

Git keeps track of all your changes and lets you collaborate with teammates without overwriting each other's work. Here's the daily workflow.

### 1. Create a Branch

Before making changes, create a new branch. Think of it as your own workspace:

```bash
git checkout -b add-customer-validation
```

Replace `add-customer-validation` with a short description of what you're working on. Use dashes instead of spaces.

### 2. Make Your Changes

Edit your files in VS Code. When you're done, check what changed:

```bash
git status
```

This shows which files you modified, added, or deleted.

### 3. Stage Your Changes

Tell Git which files to include in your next save point:

```bash
git add src/FileCabinet/SuiteScripts/my_script.js
```

To stage all changed files at once:

```bash
git add .
```

### 4. Commit Your Changes

Save your staged changes with a descriptive message:

```bash
git commit -m "Add customer validation to sales order script"
```

Write your message as if completing the sentence: "This commit will..." Keep it clear and specific.

### 5. Switch Back to Main

When your work is done and tested, switch to the main branch:

```bash
git checkout main
```

### 6. Pull Latest Changes

Get any changes your teammates have pushed while you were working:

```bash
git pull
```

### 7. Merge Your Branch

Bring your changes into main:

```bash
git merge add-customer-validation
```

### 8. Push to the Remote Repository

Send your changes to GitHub so everyone can see them:

```bash
git push
```

### What to Do If You See a Merge Conflict

Sometimes Git can't automatically combine your changes with a teammate's changes. You'll see a message like:

```
CONFLICT (content): Merge conflict in src/FileCabinet/SuiteScripts/my_script.js
Automatic merge failed; fix conflicts and then commit the result.
```

**Don't panic. Don't force-push.** Ask your team lead or a teammate for help. Merge conflicts are normal and easy to resolve with guidance.

---

## Git Workflow -- GitHub Desktop

If you prefer a visual interface, GitHub Desktop does the same things as the terminal commands above.

### Download GitHub Desktop

If you haven't already, download it from https://desktop.github.com and sign in with your GitHub account. Signing in also sets up Git credentials for your terminal automatically.

### 1. Open Your Project

**File > Add Local Repository** and select your project folder. Or if you've already cloned it, it should appear in the left sidebar.

### 2. Create a Branch

Click the **Current Branch** dropdown at the top of the window. Click **New Branch**. Type a name (e.g., `add-customer-validation`) and click **Create Branch**.

### 3. Make Your Changes

Edit files in VS Code as normal. When you switch back to GitHub Desktop, it will show your changes in the left sidebar. You can click on any file to see exactly what changed.

### 4. Commit Your Changes

At the bottom-left of the window:
1. Type a short summary (e.g., "Add customer validation to sales order script")
2. Click the **Commit to [your-branch-name]** button

### 5. Switch to Main

Click the **Current Branch** dropdown at the top and select **main**.

### 6. Pull Latest Changes

Click the **Fetch origin** button at the top. If there are new changes, it will change to **Pull origin** -- click it to download them.

### 7. Merge Your Branch

Go to **Branch** menu > **Merge into current branch**. Select your feature branch from the list and click **Merge**.

### 8. Push

Click the **Push origin** button at the top to send everything to GitHub.

### Merge Conflicts in GitHub Desktop

If there's a conflict, GitHub Desktop will show a warning and list the conflicted files. **Don't panic.** Ask your team lead for help -- they can walk you through resolving it in VS Code.
```

- [ ] **Step 2: Commit**

```bash
git add DEVELOPER-GUIDE.md
git commit -m "Add Developer Guide: pushing, terminal and desktop Git workflows"
```

---

### Task 11: Write DEVELOPER-GUIDE.md -- Quick Reference, Joining, and Rollback

**Files:**
- Modify: `DEVELOPER-GUIDE.md`

- [ ] **Step 1: Append the remaining sections**

Add to the end of `DEVELOPER-GUIDE.md`:

```markdown
---

## Quick Reference

| What you want to do | Command |
|---------------------|---------|
| List files in NetSuite | `suitecloud file:list --folder "/SuiteScripts"` |
| Import a file | `suitecloud file:import --paths "/SuiteScripts/file.js"` |
| Import all objects | `suitecloud object:import --destinationfolder "/Objects" --type ALL --scriptid ALL` |
| Upload a file | `suitecloud file:upload --paths "/FileCabinet/SuiteScripts/file.js"` |
| Push one object | `suitecloud object:update --scriptid customrecord_name` |
| Deploy everything | `suitecloud project:deploy` |
| Create a branch | `git checkout -b branch-name` |
| Check what changed | `git status` |
| Stage all changes | `git add .` |
| Stage one file | `git add path/to/file` |
| Commit | `git commit -m "description of changes"` |
| Switch to main | `git checkout main` |
| Pull latest | `git pull` |
| Merge branch | `git merge branch-name` |
| Push to GitHub | `git push` |

---

## Joining an Existing Project

If the project already exists and you're joining the team, you don't need the setup tool. Follow these steps instead.

### 1. Install Prerequisites

Make sure you have these installed:

- **Node.js** -- download from https://nodejs.org (LTS version)
- **Git** -- download from https://git-scm.com
- **SuiteCloud CLI** -- open your terminal and run:
  ```bash
  npm install -g --acceptSuiteCloudSDKLicense @oracle/suitecloud-cli
  ```
- **VS Code** -- download from https://code.visualstudio.com
- **SuiteCloud Extension for VS Code** -- open VS Code, click the Extensions icon (left sidebar), search "SuiteCloud", install the one by Oracle
- **GitHub Desktop** (optional) -- download from https://desktop.github.com

### 2. Clone the Repository

```bash
git clone https://github.com/ekwani/my-project.git
```

Replace the URL with the actual repository URL your team lead provides.

### 3. Open the Project

```bash
cd my-project
```

Then open it in VS Code: **File > Open Folder** and select the project folder.

### 4. Install Dependencies

If the project has a `package.json` file:

```bash
npm install
```

### 5. Connect to NetSuite

Each developer needs to set up their own connection:

```bash
suitecloud account:setup
```

This opens your browser for NetSuite login. Follow the prompts to authenticate. This creates a `suitecloud.config.js` file on your machine only (it's not shared via Git).

### 6. Verify Your Connection

```bash
suitecloud file:list --folder "/SuiteScripts"
```

If you see a list of files, you're connected and ready to work.

---

## Rollback Guidance

### Something Went Wrong With a Deploy?

If a `project:deploy` caused issues in the sandbox:

1. **Don't panic.** The previous version of your code is safe in Git.
2. **Tell your team** so nobody else deploys on top of the problem.
3. **Switch to the last known good state:**
   ```bash
   git checkout main
   git pull
   ```
4. **Re-deploy the good version:**
   ```bash
   suitecloud project:deploy
   ```

If you're not sure what the "good version" is, ask your team lead before deploying anything.

**Never force-push** (`git push --force`) -- this can erase your teammates' work. If Git won't let you push, ask for help.
```

- [ ] **Step 2: Commit**

```bash
git add DEVELOPER-GUIDE.md
git commit -m "Add Developer Guide: quick reference, joining, and rollback sections"
```

---

## Chunk 5: Final Integration & Verification

### Task 12: Run full test suite and verify everything

**Files:**
- Verify all files exist and tests pass

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: All tests pass across all test files.

- [ ] **Step 2: Verify the file structure matches the spec**

Run: `find . -not -path './node_modules/*' -not -path './.git/*' | sort`

Expected structure:
```
.
./DEVELOPER-GUIDE.md
./.gitignore
./bin
./bin/index.js
./lib
./lib/auth.js
./lib/git-init.js
./lib/prerequisites.js
./lib/scaffold.js
./lib/setup.js
./lib/utils.js
./package-lock.json
./package.json
./tests
./tests/auth.test.js
./tests/git-init.test.js
./tests/prerequisites.test.js
./tests/scaffold.test.js
./tests/utils.test.js
```

- [ ] **Step 3: Verify CLI starts correctly**

Run: `node bin/index.js`
Expected: Banner displays, prerequisite checks begin. Ctrl+C to exit.

- [ ] **Step 4: Read through DEVELOPER-GUIDE.md end to end**

Verify all sections are present and internally consistent:
- Phase 0: Running the Setup Tool
- Importing from NetSuite
- Pushing to NetSuite
- Git Workflow -- Terminal
- Git Workflow -- GitHub Desktop
- Quick Reference
- Joining an Existing Project
- Rollback Guidance

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "Complete netsuite-setup CLI tool and Developer Guide"
```
