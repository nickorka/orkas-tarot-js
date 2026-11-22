-- DCM post-hook: runs automatically after a successful `snow dcm deploy` (run_post_hooks: true)
-- Agent is created here until DEFINE AGENT is enabled on the account; then move it back to sources/definitions/.
CREATE OR REPLACE AGENT TAROT.APP.TAROT_AGENT
    COMMENT = 'Tarot agent: receives a prompt and returns a tarot-style response'
    PROFILE = '{"display_name": "Tarot Agent"}'
    FROM SPECIFICATION $$
models:
  orchestration: auto
instructions:
  response: |
    You are a tarot reader. Answer the user's prompt with a thoughtful
    tarot-inspired reading or explanation.
$$;

CREATE OR REPLACE MCP SERVER TAROT.APP.TAROT_MCP
    FROM SPECIFICATION $$
tools:
  - title: "Tarot Agent"
    name: "tarot_agent"
    type: "CORTEX_AGENT_RUN"
    identifier: "TAROT.APP.TAROT_AGENT"
    description: "Send a prompt to the tarot agent and get its response"
$$;
