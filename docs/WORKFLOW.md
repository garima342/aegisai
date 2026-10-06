# Team workflow

Order of work (each module = build issues -> docs issue -> close milestone):

F0 -> M1 (A, B, C) -> M2 (A, B, C) -> M3 (A, B, C, D) -> M4 (A, B, C) -> M5 (A, B, C, D) -> F1/F2/F3

Suggested split: Garima = M1, M3, M5-A/B; Ankita = M2, M4, M5-C. Swap reviewers on every PR.
Parallel option: M2-A, M3-A and M4-A only depend on F0, so both of you can start different engines at once.

Using an agent in VS Code / Antigravity:
1. Open the issue on GitHub, copy the section "Prompt for coding agent" plus the Tasks/Acceptance criteria into the agent chat.
2. Tell it: "Read AGENTS.md first, then work on this issue on branch feature/<issue-number>-<name>."
3. Review the diff yourself, run tests, open a PR with `Closes #<n>`.
4. A module is complete only when its [Mx-docs] issue is merged.
