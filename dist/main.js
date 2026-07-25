"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nitrostack/core");
const app_module_js_1 = require("./app.module.js");
async function bootstrap() {
    await core_1.McpApplicationFactory.create(app_module_js_1.AppModule);
    console.log('[CircuLink] MCP server running on http://localhost:3000');
    console.log('[CircuLink] 6 agents: Intake, Verification, Sourcing, Matching, Logistics, Prediction');
    console.log('[CircuLink] MCP endpoint: POST /mcp');
    console.log('[CircuLink] Open NitroStudio to test tools interactively');
}
bootstrap().catch((error) => {
    console.error('[CircuLink] Failed to start:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map