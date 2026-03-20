# SuiteCloud Development Process -- Design Spec

**Date:** 2026-03-20
**Status:** Draft
**Author:** Ekwani Consulting

---

## Overview

This spec defines two deliverables that together provide Ekwani Consulting's development team with a standardized process for working with NetSuite's SuiteCloud Development Framework (SDF) using VS Code and Git.

The primary goal is to bring existing NetSuite customizations under source control with a consistent, repeatable process that beginners can follow confidently.

---

## Target Audience

- Developers with minimal terminal/CLI experience
- Primarily accustomed to NetSuite's browser-based UI
- Documentation must be comprehensive, step-by-step, and assume no prior knowledge of Git or SuiteCloud CLI

---

## Constraints & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project type | Account Customization (ACP) | Team manages customizations on accounts they own |
| Authentication | Browser-based OAuth 2.0 (`account:setup`) | Simplest for local development, no certificate management |
| Git workflow | Feature branches off `main`, no PRs | Lightweight process appropriate for current team size |
| Commit messages | Simple descriptive English | Lower barrier for beginners |
| Target environment | Shared sandbox | Single deployment target for the team |
| CLI tool language | Node.js | Already a prerequisite for SuiteCloud CLI, cross-platform |
| CLI hosting | Ekwani Consulting private GitHub repo | Run via `npx`, secure access via GitHub permissions |

---

## Deliverable 1: Interactive CLI Setup Tool

### Package Details

- **Package name:** `netsuite-setup`
- **Repository:** `ekwani-consulting/netsuite-setup` (private, Ekwani Consulting GitHub org)
- **Invocation:** `npx github:ekwani-consulting/netsuite-setup`
- **Dependencies:** `inquirer` (interactive prompts), `chalk` (colored output)

### GitHub Access Prerequisite

Since the repository is private, developers must have GitHub access configured before running the `npx` command. The Developer Guide (Phase 0) will walk them through one of these options:

1. **GitHub Desktop (recommended for beginners)** -- signing into GitHub Desktop automatically configures Git credentials on the machine via the Git credential manager. This is the simplest path.
2. **HTTPS + Git Credential Manager** -- install Git Credential Manager (bundled with Git for Windows, available via Homebrew on macOS), then `git clone` any private repo once to trigger the browser login flow. Credentials are cached automatically.
3. **SSH key** -- for more experienced developers who prefer SSH.

The `npx github:` command uses Git under the hood, so any method that authenticates Git with GitHub will work.

### Repository Structure

```
netsuite-setup/
  bin/
    index.js              -- entry point (#!/usr/bin/env node)
  lib/
    prerequisites.js      -- checks for Node, npm, Git, SuiteCloud CLI
    scaffold.js           -- runs project:create with user inputs
    auth.js               -- launches account:setup
    git-init.js           -- git init, .gitignore, first commit, remote push
    utils.js              -- shared helpers (run shell commands, print messages)
  package.json            -- name, bin field, dependencies
```

### Interactive Flow

The script walks developers through 5 sequential stages:

#### Stage 1: Welcome

Display a branded welcome banner explaining what the tool will do.

#### Stage 2: Prerequisite Checks

Automatically detect and verify:

| Check | Pass | Fail |
|-------|------|------|
| Node.js installed | Show version with green checkmark | Print download URL, exit |
| npm installed | Show version with green checkmark | Print download URL, exit |
| Git installed | Show version with green checkmark | Print download URL, exit |
| SuiteCloud CLI installed | Show version with green checkmark | Prompt: "Install now?" -- if yes, run `npm install -g --acceptSuiteCloudSDKLicense @oracle/suitecloud-cli` |

If a prerequisite that cannot be auto-installed is missing, the script exits with a clear message and the exact URL to download it.

#### Stage 3: Project Scaffold

1. Prompt for **project name** (text input)
2. Confirm **creation directory** (defaults to current directory, allow override)
3. Run: `suitecloud project:create --type ACCOUNTCUSTOMIZATION --projectname "<user-input>"`
4. Print success message with the full path to the created project

#### Stage 4: Authentication

1. Prompt: "Set up NetSuite account connection now?" (Y/n)
2. If yes, prompt for **authentication ID** (text input, suggest "sandbox" as default)
3. Print guidance: "Your browser will open for NetSuite login. Complete the login, select your role, and click Allow. Then return here."
4. Run: `suitecloud account:setup` (the CLI's own interactive flow handles the auth ID prompt and browser launch; the tool passes control to it directly)
5. After completion, optionally verify by running: `suitecloud file:list --folder "/SuiteScripts"`
6. Print success with account confirmation

**Note:** The `suitecloud account:setup` command runs its own interactive prompts (including asking for the auth ID). The CLI tool collects the auth ID suggestion beforehand for guidance purposes, then delegates entirely to SuiteCloud's interactive flow. This avoids duplicating prompts or passing flags that may not be supported in interactive mode.

#### Stage 5: Git Initialization & Push

1. Run `git init -b main` inside the project directory (forces `main` as the default branch name regardless of the developer's Git version or config)
2. Create `.gitignore` with:
   ```
   node_modules/
   .suitecloud-sdk/
   suitecloud.config.js
   ```
3. Run `npm install` if a `package.json` with dependencies exists (SuiteCloud may scaffold one)
4. Run `git add .` and `git commit -m "Initial project scaffold"`
5. Prompt for **remote repository URL** (text input, e.g., `https://github.com/ekwani/my-project.git`)
6. Run `git remote add origin <url>` and `git push -u origin main`
7. Print success message

**Note on `suitecloud.config.js` in `.gitignore`:** This file stores the developer's local authentication ID. It is gitignored because each developer authenticates independently. The "Joining an Existing Project" section of the Developer Guide covers how new developers set up their own connection after cloning.

#### Completion

Display a summary box with:
- Project location
- Connected account
- Remote repository URL
- "Next steps" pointing to the Developer Guide

### Error Handling

- Every action validates before proceeding
- Failures print plain English explanations with suggested fixes
- Each stage offers retry or skip options where appropriate
- The script never silently fails

---

## Deliverable 2: Developer Reference Guide

### File

`DEVELOPER-GUIDE.md` -- lives in the same repository as the CLI tool.

### Sections

#### Phase 0: Running the Setup Tool

- How to open a terminal (macOS Terminal and Windows Command Prompt/PowerShell)
- How to navigate to a projects folder (`cd ~/Projects`)
- The exact `npx` command to run
- Step-by-step walkthrough of the interactive flow (what to expect at each prompt)
- Explanation of the browser OAuth login screen
- Troubleshooting tips for common issues

#### Importing from NetSuite

Commands covered with plain English explanations and example output:

| Command | Purpose |
|---------|---------|
| `suitecloud file:list --folder "/SuiteScripts"` | See what script files exist in your account |
| `suitecloud file:import --paths "/SuiteScripts/my_script.js"` | Import a specific script file |
| `suitecloud object:list --type ALL` | See what custom objects exist in your account |
| `suitecloud object:import --destinationfolder "/Objects" --type ALL --scriptid ALL` | Import all objects |

Includes a reminder to commit after importing:
```
git add .
git commit -m "Import existing scripts from NetSuite"
git push
```

#### Pushing to NetSuite

Commands covered with guidance on when to use each:

| Command | Purpose | When to use |
|---------|---------|-------------|
| `suitecloud file:upload --paths "/FileCabinet/SuiteScripts/my_script.js"` | Upload a single script file | Quick script changes |
| `suitecloud object:update --scriptid customrecord_myrecord` | Push a single object | Individual object changes |
| `suitecloud project:deploy` | Deploy the entire project | Bigger changes, multiple files/objects |

Includes a warning about coordinating deployments to the shared sandbox.

**Note on file paths:** Import paths (e.g., `/SuiteScripts/my_script.js`) are relative to the NetSuite File Cabinet. Upload paths (e.g., `/FileCabinet/SuiteScripts/my_script.js`) are relative to the local project's `src/` folder. The guide will clearly explain this distinction with examples.

#### Git Workflow -- Terminal

Step-by-step commands for the daily workflow:

1. **Create a branch:** `git checkout -b my-feature-branch`
2. **Check status:** `git status`
3. **Stage changes:** `git add src/FileCabinet/SuiteScripts/my_script.js`
4. **Commit:** `git commit -m "Add customer validation script"`
5. **Switch to main:** `git checkout main`
6. **Pull latest changes:** `git pull` (get any changes your teammates pushed)
7. **Merge:** `git merge my-feature-branch`
8. **Push:** `git push`

Each command includes a one-line explanation of what it does.

Includes a "What to do if you see a merge conflict" callout: stop, do not force-push, and ask a teammate or lead for help. Brief explanation of what a conflict looks like in the terminal.

#### Git Workflow -- GitHub Desktop

The same operations described as GUI actions:

1. **Open project** in GitHub Desktop
2. **Create a branch** -- Branch menu > New Branch
3. **View changes** -- left sidebar shows modified files
4. **Commit** -- type message in bottom-left, click Commit button
5. **Switch branches** -- dropdown at top of window, select `main`
6. **Pull latest** -- click "Fetch origin" / "Pull origin" to get teammates' changes
7. **Merge** -- Branch menu > Merge into current branch
8. **Push** -- click "Push origin" button

Each step described as a UI action with expected result. Includes a note on how GitHub Desktop surfaces merge conflicts visually and what to do (ask for help).

**Note:** The Developer Guide will include a brief section on downloading and installing GitHub Desktop (desktop.github.com) at the start of this section, with a note that signing in also configures Git credentials for the terminal.

#### Quick Reference

A single table with two columns:

| What you want to do | Command |
|---------------------|---------|
| List files in NetSuite | `suitecloud file:list --folder "/SuiteScripts"` |
| Import a file | `suitecloud file:import --paths "/SuiteScripts/file.js"` |
| Import all objects | `suitecloud object:import --destinationfolder "/Objects" --type ALL --scriptid ALL` |
| Upload a file | `suitecloud file:upload --paths "/FileCabinet/SuiteScripts/file.js"` |
| Deploy project | `suitecloud project:deploy` |
| Create a branch | `git checkout -b branch-name` |
| Stage changes | `git add file-path` |
| Commit | `git commit -m "description"` |
| Switch to main | `git checkout main` |
| Pull latest changes | `git pull` |
| Merge branch | `git merge branch-name` |
| Push to remote | `git push` |

No explanations -- just copy-paste commands.

#### Joining an Existing Project

For developers joining after the initial setup (cloning an existing repo):

1. **Install prerequisites** -- Node.js, npm, Git, SuiteCloud CLI (same as Phase 0)
2. **Clone the repository:** `git clone <repo-url>`
3. **Navigate into the project:** `cd <project-name>`
4. **Run `npm install`** if a `package.json` exists
5. **Set up NetSuite connection:** `suitecloud account:setup` (each developer authenticates independently -- this creates their own `suitecloud.config.js` which is gitignored)
6. **Verify connection:** `suitecloud file:list --folder "/SuiteScripts"`

This section will be written clearly so a new team member can go from zero to connected without needing the CLI setup tool.

#### Rollback Guidance

A brief "Something went wrong with a deploy?" section:

- If a `project:deploy` causes issues in the sandbox, explain how to revert: check out a known-good commit (`git checkout main`), verify the files, and re-deploy
- Emphasize: do not panic, do not force-push, communicate with the team

---

## Out of Scope

- CI/CD pipeline setup (future consideration)
- Pull request workflow (not yet needed)
- Multiple environment deployments (only shared sandbox for now)
- SuiteApp project type (ACP only)
- Certificate-based authentication (`account:setup:ci`)
- Unit testing setup

---

## Implementation Sequence

1. **Create the GitHub repository** in the Ekwani Consulting org
2. **Build the CLI tool** -- `package.json`, entry point, prerequisite checks, scaffold, auth, git init
3. **Test the CLI tool** -- run through the full flow on a clean machine
4. **Write the Developer Guide** -- all sections as specified above
5. **Team onboarding** -- distribute the `npx` command and guide to developers
