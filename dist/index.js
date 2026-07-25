"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const core_1 = require("@nitrostack/core");
const app_module_js_1 = require("./app.module.js");
async function bootstrap() {
    const server = await core_1.McpApplicationFactory.create(app_module_js_1.AppModule);
    console.log('[CircuLink] 6 agents loaded — MCP server starting');
    console.log('[CircuLink] Intake | Verification | Sourcing | Matching | Logistics | Prediction');
}
bootstrap().catch((error) => {
    console.error('[CircuLink] Failed to start:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map