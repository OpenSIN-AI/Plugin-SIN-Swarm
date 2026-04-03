# Agent: {NAME}

**Team:** {TEAM}  
**Protocol:** A2A (Agent-to-Agent)  
**Status:** Active  
**Repository:** https://github.com/OpenSIN-AI/{NAME}

## Capabilities

{DESCRIPTION}

## Communication

- **Input:** A2A messages from orchestrator
- **Output:** A2A messages to other agents
- **MCP:** Standard OpenSIN MCP servers

## Security

- All operations logged to OpenSIN-Ledger
- Requires authorization token
- Guardrails enforced on all inputs/outputs

## Setup

\`\`\`bash
git clone https://github.com/OpenSIN-AI/{NAME}.git
cd {NAME}
npm install
npm start
\`\`\`

## License

MIT
