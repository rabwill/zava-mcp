# Zava Insurance — MCP Server

An MCP (Model Context Protocol) server for **Zava Insurance** that exposes claims management tools and rich interactive widgets for ChatGPT.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Protocol | MCP SDK (`@modelcontextprotocol/sdk`) — low-level `Server` class |
| Transport | Express + `StreamableHTTPServerTransport` (stateless, JSON response) |
| Database | Azure Table Storage (`@azure/data-tables`) via Azurite local emulator |
| Widgets | React 18 + Fluent UI v9 + Vite (single-file HTML builds) |
| Theme | Reactive dark/light via `useSyncExternalStore` + `openai:set_globals` event |
| Language | TypeScript throughout |

## Tools

### Widget Tools (render interactive UI)

| Tool | Description |
|------|-------------|
| `show-claims-dashboard` | Grid view of all claims with status filters, metrics, and click-to-detail |
| `show-claim-detail` | Detailed view of a single claim with inspections, POs, and a map |
| `show-contractors` | Filterable list of contractors with ratings and specialties |

### Data Tools

| Tool | Description |
|------|-------------|
| `update-claim-status` | Update a claim's status and add notes |
| `update-inspection` | Update inspection status, findings, and recommended actions |
| `update-purchase-order` | Update a purchase order's status |
| `get-claim-summary` | Text summary of a specific claim |
| `list-inspectors` | List all inspectors with specializations |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start Azurite (local storage emulator)
azurite-table --silent &

# 3. Seed the database
npm run seed

# 4. Build widgets
npm run build:widgets

# 5. Start the MCP server (port 3001)
npm run dev
```

Connect ChatGPT to: `http://localhost:3001/mcp`

## Sample Prompts

| Prompt | What it does |
|--------|-------------|
| *Show me all insurance claims* | Opens the claims dashboard widget |
| *Show claims that are pending* | Dashboard filtered to pending claims |
| *Show me claim CN202504990* | Opens the detail view for that claim |
| *Approve claim 3 and add a note "Verified by adjuster"* | Updates claim status via `update-claim-status` |
| *Show me all contractors* | Opens the contractors list widget |
| *Show only preferred roofing contractors* | Filtered contractors list |
| *Mark inspection insp-005 as completed with findings "No structural damage found"* | Updates inspection |
| *Approve purchase order po-003* | Updates PO status |
| *Give me a summary of claim 7* | Returns a text summary |
| *List all inspectors* | Shows inspectors and their specializations |

## Project Structure

```
├── server/src/mcp-server.ts   # MCP server (tools, resources, transport)
├── server/src/database.ts     # Azure Table Storage data layer
├── widgets/src/
│   ├── claims-dashboard/      # Master-detail claims widget
│   ├── claim-detail/          # Standalone claim detail widget
│   ├── contractors-list/      # Contractors list widget
│   └── hooks/                 # Shared hooks (useOpenAiGlobal, useThemeColors)
├── assets/                    # Built single-file HTML widgets
└── db/                        # Seed data (JSON)
```
