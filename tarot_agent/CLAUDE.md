# tarot_agent (DCM project)

Snowflake DCM project that deploys a Cortex Agent (`TAROT.APP.TAROT_AGENT`) and an MCP server (`TAROT.APP.TAROT_MCP`) whose single `CORTEX_AGENT_RUN` tool forwards a prompt to the agent and returns its output.

## Target

- DCM project: `TAROT.APP.TAROT_AGENT` (target `ORKAS_DBA`, owner role `DBA`, account `EVOHOMA-LAB15936`)
- Connection: `ORKAS_DBA`
- The `TAROT` database and `TAROT.APP` schema already exist; the project cannot define them.

## Layout

- `manifest.yml` — targets; `run_post_hooks: true` enables the post-hook.
- `sources/definitions/definitions.sql` — DCM `DEFINE` statements (currently none).
- `sources/posthooks/posthook.sql` — runs after a successful `snow dcm deploy`; creates the agent, then the MCP server (order matters: the server references the agent).

## Why the agent is in the post-hook

`DEFINE AGENT` (DCM early access) fails on this account with `syntax error ... unexpected 'AGENT'`, so the feature is not enabled yet. Until it is, the agent is created with `CREATE OR REPLACE AGENT` in the post-hook. Consequences:

- Neither object appears in `snow dcm plan` output.
- Every deploy recreates both objects, wiping agent named versions and any grants on them — put grants in `posthook.sql` after the `CREATE` statements.
- Removing them from the post-hook does not drop them.

When `DEFINE AGENT` is enabled, move the agent back to `sources/definitions/` using the inline syntax from the early-access docs (`SPECIFICATION = $$ ... $$`, optional `PROFILE = $$ ... $$`), not `FROM SPECIFICATION`. MCP servers have no `DEFINE` support; keep `TAROT_MCP` in the post-hook.

Reference: https://docs.snowflake.com/en/LIMITEDACCESS/dcm-projects/dcm-projects-early-access

## Working conventions

- The user runs all `snow dcm` commands (analyze/compile/plan/deploy) and tests SQL scripts themselves. Do not execute them; edit files and hand over the commands.
- Snowflake CLI is the `dcm-early-access` build (3.34.0+dcm-early-access).
- Deploy flow: `snow dcm plan -c ORKAS_DBA` → review `out/plan/plan_result.json` → `snow dcm deploy -c ORKAS_DBA --alias <name>`.
