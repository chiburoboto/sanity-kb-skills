# Stage 6. Connect coding agents

## Ask what "connect" means first

- **A coding agent**, such as Claude Code, Cursor or Codex, reading the Knowledge Base while the user works. This file covers that.
- **An agent inside the user's application**, such as a support chatbot. This skill doesn't build that. It needs an LLM provider and application code. Do steps 1 to 3 below so the endpoint works, then point the user to Sanity's guide at `https://www.sanity.io/docs/ai/sanity-context`.

If the user only says "connect an agent", ask which one they mean.

## The two values every agent needs

```
URL:    https://api.sanity.io/v1/context/organizations/<org-id>/mcp/<endpoint-name>
Header: Authorization: Bearer <organisation token with Context Viewer>
```

In Knowledge Base mode the endpoint serves two tools, `initial_context` and `knowledge_base_read`. Agents should call `initial_context` first. The server says so in its own instructions.

Sanity's dashboard offers a ready-made setup prompt that lists four tools, `initial_context`, `schema_explorer`, `groq_query` and `array_field_reader`. Those are the GROQ mode tools. Trust what the endpoint returns in step 3, not that list.

## 1. The user creates the endpoint

The CLI can't do this. Walk the user through it.

1. Open `sanity.io/@<org-id>/context`.
2. Next to **MCP endpoints**, press **New**.
3. Give it a name with lowercase letters, numbers and hyphens, up to 64 characters. The name goes in the URL and can't change later.
4. Pick this Knowledge Base as the **only** source. If a dataset source is attached too, the endpoint runs in GROQ mode and ignores the Knowledge Base.
5. Leave the instructions empty.

## 2. The user creates the token

You can't create it and must never see it. Give the user these steps.

1. Open `sanity.io/manage`, choose the **organisation**, not a project, then **API**, then **Tokens**.
2. Add a token with **Context Viewer** permission only. A project token fails with a 403 and `contextGrantRequired`, however broad its permissions.
3. Create one token per tool, named after it, such as `kb-cursor`. A leaked token then breaks one tool.
4. Store it in an environment variable, never in a committed file.
   - Windows: `setx SANITY_ORGANIZATION_TOKEN "<token>"`, then fully restart the agent app.
   - macOS and Linux: add `export SANITY_ORGANIZATION_TOKEN="<token>"` to the shell profile, then restart the terminal.

A Context Viewer token can read every endpoint in the organisation. Hosted tools such as v0, Lovable and Replit store it on their servers. For client work, use the client's own organisation.

## 3. Confirm the endpoint serves this Knowledge Base

A connection that works proves little. It may be a different Knowledge Base. In testing, an inherited `SANITY_CONTEXT_MCP_URL` still pointed at another project's endpoint, and every check passed against the wrong content.

Always write the URL out in full. Don't read it from an environment variable someone set earlier.

If the endpoint is already connected to you as MCP tools, call `initial_context` yourself. Otherwise use this one-off request. It is a diagnostic, not a pattern for application code. It was tested on 2026-09-17.

```bash
curl -s -X POST "https://api.sanity.io/v1/context/organizations/<org-id>/mcp/<endpoint-name>" \
  -H "Authorization: Bearer $SANITY_ORGANIZATION_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"initial_context","arguments":{}}}'
```

Check four things in the response.

1. The text contains the line ``Knowledge base id: `<kb-id>` `` with the id from `kb-setup.md`. If it shows a different id, or several, the endpoint has the wrong sources. Several Knowledge Bases on one endpoint is allowed, but then every question has to name the right one.
2. The response has no `"isError": true`. MCP reports a failed tool inside a successful response, so an HTTP 200 is not enough. "No readable Knowledge Base" arrives this way.
3. Swap the body for `{"jsonrpc":"2.0","id":1,"method":"tools/list"}`. Two tools means Knowledge Base mode. Four means GROQ mode, so go back to step 1.4.
4. Read one entry with `knowledge_base_read`, passing `{"knowledgeBase":"<kb-id>","paths":["<entry-path>"]}`, and confirm the body isn't empty and matches what stage 3 read.

For HTTP errors, see `blocked.md`.

## 4. Configure the agent

The per-tool steps were checked against each tool's docs on 2026-09-16. MCP settings change often. If a step doesn't match, check the tool's docs.

### Claude Code

`.mcp.json` in the project.

```json
{
  "mcpServers": {
    "<kb-name>": {
      "type": "http",
      "url": "https://api.sanity.io/v1/context/organizations/<org-id>/mcp/<endpoint-name>",
      "headers": { "Authorization": "Bearer ${SANITY_ORGANIZATION_TOKEN}" }
    }
  }
}
```

### Cursor

`.cursor/mcp.json` in the project, or `~/.cursor/mcp.json` for all projects.

```json
{
  "mcpServers": {
    "<kb-name>": {
      "url": "https://api.sanity.io/v1/context/organizations/<org-id>/mcp/<endpoint-name>",
      "headers": { "Authorization": "Bearer ${env:SANITY_ORGANIZATION_TOKEN}" }
    }
  }
}
```

Cursor's syntax is `${env:NAME}`, not `${NAME}`. A reported bug makes remote servers send the literal `${env:...}` string. If the connection returns 401, the user puts the token in the user-level `~/.cursor/mcp.json`, never in a project file that gets committed. Third-party pricing guides say MCP needs Cursor Pro or higher.

### Codex

`~/.codex/config.toml`, or `.codex/config.toml` in the repo.

```toml
[mcp_servers.<kb-name>]
url = "https://api.sanity.io/v1/context/organizations/<org-id>/mcp/<endpoint-name>"
bearer_token_env_var = "SANITY_ORGANIZATION_TOKEN"
```

### v0

In the prompt form, open the **+** menu, choose **MCPs**, add a custom server with the URL, choose **Bearer Token** and paste the token. v0 warns that remote MCP can raise the cost per message.

### Lovable

Open **Connectors**, press **+**, choose **MCP server**. Keep the **Direct** connection type and enter the URL. Choose **Bearer token or API key** instead of OAuth and paste the token. The server name rejects `&`. Verified on a free account. Everyone in the workspace can use the token through the connector.

### Replit

In Agent, open **MCP Servers**, press **+ Add MCP server**, paste the URL, open **Advanced settings**, and add a header named `Authorization` with the value `Bearer <token>`. Press **Test & save**.

### Any other agent

It needs support for a remote HTTP MCP server with a custom header. Give it the URL and the `Authorization` header above.

## 5. Test inside the agent

Ask two or three questions whose answers you know from the content. A good answer calls `initial_context`, then `knowledge_base_read`, and cites sources. An answer with no tool calls came from the model's own knowledge, so the connection isn't in use.

Include a question that names something only this project has, such as one of its product names. A right answer to that confirms the agent reads this Knowledge Base and not another one.

To check a specific claim, ask "Is this text accurate: '<claim>'?". A Knowledge Base that is only Built or Reviewed gives unreliable verdicts here. In testing it accepted a wrong promotion and doubted a correct cut-off time, until the conflicts were resolved and the content fixed.

## Known limits of the answers

- Citations inside an entry can point at the wrong source document. Don't build links to Studio fields from them.
- A build can add a claim no source makes. Stage 3 looks for those.
