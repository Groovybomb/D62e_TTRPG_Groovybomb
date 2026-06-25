# Git Workflow & Commit Guide

**TL;DR:** After you code, commit your changes to track progress on GitHub.

## Quick Reference

```bash
# See what you changed
git status

# Stage all changes
git add .

# Commit with message
git commit -m "Brief description of changes"

# Push to GitHub
git push
```

## Commit Message Examples

### ✅ Good Examples
```
git commit -m "Add character editing form to frontend"
git commit -m "Implement skill roll mechanic in backend"
git commit -m "Fix wild dice calculation in rolls.js"
git commit -m "Create WebSocket handler for real-time updates"
git commit -m "Update WORK_LOG.md: completed spaceship routes"
git commit -m "Add password hashing with bcrypt"
git commit -m "Refactor RollService for clarity"
```

### ❌ Bad Examples
```
git commit -m "stuff"
git commit -m "fix"
git commit -m "updated"
git commit -m "changes"
```

## Standard Workflow

1. **Before starting work:**
   ```bash
   git pull origin main
   ```

2. **While coding:**
   - Make changes to files
   - Test locally
   - Verify it works

3. **After finishing (every session!):**
   ```bash
   # Check what changed
   git status
   
   # Stage changes
   git add .
   
   # Commit with message
   git commit -m "Description of what you did"
   
   # Push to GitHub
   git push origin main
   ```

4. **Update tracking:**
   - Edit WORK_LOG.md to mark items complete
   - Commit WORK_LOG.md updates separately if you prefer:
     ```bash
     git add WORK_LOG.md
     git commit -m "Update WORK_LOG.md: completed X and Y"
     git push
     ```

## Commit Organization

### By Feature
```bash
# When adding a new feature
git commit -m "Add Game Master roll calling feature"
```

### By Bug Fix
```bash
# When fixing a bug
git commit -m "Fix: password not hashing on registration"
```

### By Documentation
```bash
# When updating docs
git commit -m "Update CLAUDE.md with new API endpoints"
```

### By Refactor
```bash
# When improving code structure
git commit -m "Refactor RollService for better readability"
```

## Important: What NOT to Commit

- `node_modules/` - Already in .gitignore
- `.env` files with secrets - Already in .gitignore
- `backend/data/db.json` - Your local test data, don't commit
- `dist/` or `build/` folders - Build outputs, not source code
- `*.log` files - Debug logs
- Editor temp files - Already ignored

Check .gitignore to see the full list of excluded files.

## If You Made a Mistake

### Undo last commit (not yet pushed)
```bash
git reset --soft HEAD~1
# Keeps changes in staging, let you redo commit
```

### Undo changes in a file
```bash
git checkout -- filename.js
# Reverts the file to last committed version
```

### View what you're about to commit
```bash
git diff --staged
# Shows exact changes in each file
```

## Team Tips

- **Commit frequently** - Small commits are easier to review
- **Clear messages** - Help teammates understand what changed
- **One topic per commit** - Don't mix features and fixes
- **Pull before push** - Always `git pull` first if working with teammates
- **Update WORK_LOG.md** - Let everyone know what's done

## Quick Reference: Common Commands

```bash
git status              # See what changed
git add .              # Stage all changes
git add filename.js    # Stage specific file
git commit -m "msg"    # Commit with message
git push               # Push to GitHub
git pull               # Get latest from GitHub
git log --oneline      # See recent commits
git diff               # See changes before staging
git diff --staged      # See changes after staging
```

---

**Remember:** Every commit is a checkpoint. If something breaks, we can roll back. So commit often and commit clearly! 🎲
