---
description: Commits and pushes all local changes to the GitHub repository.
---

// turbo-all
1. Check current status
```powershell
git status
```

2. Stage all changes (including deletions and new files)
```powershell
git add .
```

3. Commit changes with a timestamped message
```powershell
git commit -m "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
```

4. Push to the remote repository (main branch)
```powershell
git push origin main
```
