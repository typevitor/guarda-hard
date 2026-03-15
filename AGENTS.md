## always use pnpm

## global PRD execution rule

- For every PRD in this repository, the agent must mark each stage/checklist item as completed in the PRD immediately after finishing it.
- The agent must not start the next stage before recording completion of the current stage in the PRD.

## architecture guidance

- Before generating or reorganizing application code, consult `docs/architecture.md`.
- Follow the NestJS and Next.js modular boundaries defined there.

## frontend design skill

- For frontend UI work (new pages, components, layout redesigns, or visual polish), use the local `frontend-design` skill at `.claude/skills/frontend-design/SKILL.md`.
