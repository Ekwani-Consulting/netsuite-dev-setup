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

Since the setup tool lives in a private repository, your computer needs to be authenticated with GitHub. Pick one of these options:

**Option A: GitHub Desktop (recommended for beginners)**

1. **Download and install GitHub Desktop** from https://desktop.github.com
2. **Sign in** with your GitHub account (the one that has access to the Ekwani Consulting organization)
3. That's it -- signing into GitHub Desktop automatically sets up your Git credentials

**Option B: HTTPS + Git Credential Manager**

1. Install **Git** from https://git-scm.com (on Windows, Git Credential Manager is bundled with it; on macOS, install via `brew install git` or Xcode Command Line Tools)
2. Clone any private Ekwani Consulting repo to trigger the login flow:
   ```bash
   git clone https://github.com/ekwani-consulting/netsuite-setup.git /tmp/test-auth
   ```
3. A browser window will open -- sign in with your GitHub account
4. Your credentials are now cached automatically. You can delete the test clone: `rm -rf /tmp/test-auth`

**Option C: SSH key (for experienced developers)**

1. Generate an SSH key: `ssh-keygen -t ed25519 -C "your.email@company.com"`
2. Add the public key to your GitHub account: **Settings > SSH and GPG keys > New SSH key**
3. Paste the contents of `~/.ssh/id_ed25519.pub`
4. Test it works: `ssh -T git@github.com`

### Step 4: Run the Setup Tool

Type the following command and press Enter:

```bash
npx github:Ekwani-Consulting/netsuite-dev-setup
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
