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

- **Name:** `@ekwani/netsuite-setup` (or `netsuite-setup` scoped to the org)
- **Repository:** Ekwani Consulting GitHub organization (private)
- **Invocation:** `npx github:ekwani-consulting/netsuite-setup`
- **Dependencies:** `inquirer` (interactive prompts), `chalk` (colored output)

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
3. Run: `suitecloud account:setup`
4. Guide user: "Complete the login in your browser, then return here"
5. After completion, optionally verify by running: `suitecloud file:list --folder "/SuiteScripts"`
6. Print success with account confirmation

#### Stage 5: Git Initialization & Push

1. Run `git init` inside the project directory
2. Create `.gitignore` with:
   ```
   node_modules/
   .suitecloud-sdk/
   suitecloud.config.js
   ```
3. Run `git add .` and `git commit -m "Initial project scaffold"`
4. Prompt for **remote repository URL** (text input, e.g., `https://github.com/ekwani/my-project.git`)
5. Run `git remote add origin <url>` and `git push -u origin main`
6. Print success message

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

#### Git Workflow -- Terminal

Step-by-step commands for the daily workflow:

1. **Create a branch:** `git checkout -b my-feature-branch`
2. **Check status:** `git status`
3. **Stage changes:** `git add src/FileCabinet/SuiteScripts/my_script.js`
4. **Commit:** `git commit -m "Add customer validation script"`
5. **Switch to main:** `git checkout main`
6. **Merge:** `git merge my-feature-branch`
7. **Push:** `git push`

Each command includes a one-line explanation of what it does.

#### Git Workflow -- GitHub Desktop

The same operations described as GUI actions:

1. **Open project** in GitHub Desktop
2. **Create a branch** -- Branch menu > New Branch
3. **View changes** -- left sidebar shows modified files
4. **Commit** -- type message in bottom-left, click Commit button
5. **Switch branches** -- dropdown at top of window
6. **Merge** -- Branch menu > Merge into current branch
7. **Push** -- click "Push origin" button

Each step described as a UI action with expected result.

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
| Merge branch | `git merge branch-name` |
| Push to remote | `git push` |

No explanations -- just copy-paste commands.

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
