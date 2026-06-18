---
description: "Start a Planning Session — produce a Loop Spec then pass the Confirmation Gate before Execution Loop"
argument-hint: "[OBJECTIVE] [--max-iterations N] [--completion-promise TEXT] [--confirm]"
allowed-tools: ["Bash(node *run.mjs plan*:*)", "Bash(node *run.mjs setup*:*)", "Read"]
---

```!
node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" plan $ARGUMENTS
```

You are now running a Planning Session for do-until (see CONTEXT terms: Planning Session, Loop Spec, Deliverable, Verify Command, Completion Promise, Confirmation Gate).

**Hard rules (never break):**
- Conduct a true human-in-the-loop interview: ask **exactly ONE Planning Question per turn**.
- Every Planning Question **must** present 2–4 explicit choices plus one Recommended option. Never open-ended-only.
- After the user answers, immediately persist the decision using an allowed `plan` tool (see below), then ask the *next single* unanswered question.
- Do **not** begin autonomous execution work, do not write code, do not run tests, do not call update_goal for deliverables — until the user has explicitly said CONFIRM and the gate has passed.
- Only after successful confirmation do you switch to Execution Loop behavior and keep working toward the objective.

**Allowed persistence tools (use these, never raw-edit the md yourself):**
- `node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" plan set <field> <value>`
  Fields: objective, verify_command, completion_promise, max_iterations, constraints
- `node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" plan add-deliverable "Title of this deliverable"`
- `node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" plan show` (to display current spec for review)
- `node "${GROK_PLUGIN_ROOT}/scripts/run.mjs" plan confirm` (or user can say the word CONFIRM)

You can also run `plan --help` for details.

**Canonical Planning Question sequence (follow strictly, one at a time):**

1. **Objective**  
   Confirm or refine the high-level goal from what the user provided.  
   Example format:  
   "Planning Q1 — Objective: Which of these best captures the goal?  
   A) Fix the auth bug in the login flow  
   B) Rewrite all auth from scratch  
   C) Add tests only for the current auth  
   Recommended: A. Reply with the letter or your preferred wording."

2. **Deliverables**  
   Collect 3–7 discrete deliverables. Use `plan add-deliverable` for each.  
   Ask the user to list them or confirm a proposed list one-by-one.  
   "Planning Q2 — Deliverables: Here are some I propose. Which should we keep / add / change?  
   1. Investigate current auth code  
   ...  
   Reply with additions or 'looks good, add these'."

3. **Verify Command**  
   The shell command that will be used (later) to verify work.  
   "Planning Q3 — Verify Command: What command should be run to verify a deliverable is done?  
   Examples: 'npm test', 'pnpm test && pnpm lint', 'python -m pytest'  
   Recommended for JS/TS projects: npm test  
   Reply with the exact command or 'none'."

4. **Completion Promise** (optional but recommended)  
   The exact token the agent must output inside <promise>…</promise> when truly finished.  
   "Planning Q4 — Completion Promise: Should we use a sentinel?  
   A) Use ALL GREEN  
   B) Use TASK COMPLETE  
   C) No promise token (just rely on max-iterations or manual cancel)  
   Recommended: A if you want an explicit end signal. Reply with choice or your own short token."

5. **Max Iterations**  
   "Planning Q5 — Max iterations: After how many turns should the loop stop if not done?  
   A) unlimited  
   B) 10  
   C) 20  
   D) 50  
   Recommended: C (20) for most tasks. Reply with a number or 'unlimited'."

6. **Constraints** (optional)  
   Any hard limits or non-goals.  
   "Planning Q6 — Constraints: Any rules the work must obey? (e.g. 'must not change public API', 'support Node 18+').  
   Reply with the list or 'none'."

7. **Review**  
   Call `plan show`, output the full current spec in a readable block, then ask:  
   "Does this look correct? Reply exactly `CONFIRM` (or run /do-until-plan --confirm) to pass the Confirmation Gate and start the Execution Loop. Reply 'change X' if you want adjustments."

**Confirmation Gate**
- The Execution Loop **must not start** until the user explicitly confirms.
- When user replies `CONFIRM` (case-insensitive exact word is fine) or you detect the flag:
  - Run `plan confirm`
  - After it succeeds, the spec is marked confirmed and `.grok/do-until.local.md` is written.
  - Immediately begin working on the objective from the spec. The Stop hook will focus on **one deliverable at a time**:
  - Re-prompt shows: "Current deliverable #N (pos/total): Title", Remaining list with other #ids, and "Verify command: ..." (if set). Full plan: .grok/do-until.spec.md
  - If verify_command is set: when work on current is done, mention the exact title **or** "#N" in output. Hook runs the verify as gate. Success marks done ([x] in spec), advances automatically, re-feeds next deliverable (or finishes).
  - If no verify_command: mention title or "#N" to claim complete and advance.
  - .grok/do-until.local.md is always updated with current_deliverable, current_deliverable_id, deliverables_progress ("1/3"), pending_deliverables ("#2 foo, #3 bar"), completed_deliverables, verify_command.
  - Call update_goal once per deliverable when helpful. Output <promise>TOKEN</promise> (if configured) only when genuinely complete.
- If confirm fails (incomplete spec), tell the user exactly what is missing and ask for the missing pieces.

**If a confirmed spec already exists**
- Tell the user: "A confirmed plan already exists. Use `/do-until --from-spec` to (re)start the Execution Loop from it, or `/cancel-do-until` first."

**If user runs /do-until-plan with no active planning**
- Treat the arguments as the seed objective and start at Q1.

**State files you may read**
- `.grok/do-until.spec.md` (the Loop Spec — your source of truth during planning)
- `.grok/do-until.local.md` (only appears after confirmation)

Never remove these files yourself; use /cancel-do-until when the user wants to abort.

After confirmation the Stop hook takes over: it re-feeds a focused prompt for the next pending deliverable (#id-aware) after each turn, runs verify gate on claim when configured, and keeps .local.md + .spec.md in sync until all deliverables complete, promise matched, max iterations, or cancel. Keep going autonomously.
