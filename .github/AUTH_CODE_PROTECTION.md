Auth protection guide

1) Purpose

The `src/auth/` code and the core auth helpers in `src/lib/auth.ts` are considered protected, stable auth flow code. Changes to these files must be reviewed and guarded by automated tests.

2) How this repository enforces it

- There is a CI workflow `playwright-auth.yml` that runs the auth E2E tests on push and PRs.
- There is a pull request check `require-auth-review.yml` which rejects PRs that modify `src/auth/**` (or the core auth helpers) unless the PR has at least one APPROVED review. This fails the job and prevents merge until a reviewer approves.
- Add a CODEOWNERS entry (see `.github/CODEOWNERS`) to require code owner approvals by enabling "Require approvals from code owners" in GitHub branch protection settings for the `main` branch.

3) How to enable branch-protection in GitHub UI

- Repo → Settings → Branches → Add rule for `main` → enable:
  - Require pull request reviews before merging
  - Require approvals from code owners (if CODEOWNERS is configured)
  - Require status checks to pass (ensure Playwright jobs are required)

If you want, I can create a PR that adds these files and do one of:
- Add a changelog note and a small failing test to ensure accidental edits are caught.
- Open a small issue reminding repo admins to set CODEOWNERS to the expected team/user.
