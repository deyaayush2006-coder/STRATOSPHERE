## What changed

## Why

## Checklist
- [ ] One concern per PR, atomic commits with Conventional Commit messages
- [ ] Tests added or updated (unit, `tests/db` for policy changes, smoke for page changes)
- [ ] New database change is a **new** numbered migration (never edit an applied one)
- [ ] Migration order noted if it must run before/after the deploy
- [ ] No secrets, keys or personal data in the diff
