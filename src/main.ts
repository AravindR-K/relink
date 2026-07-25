import { McpApplicationFactory } from '@nitrostack/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  await McpApplicationFactory.create(AppModule);

  console.log('[CircuLink] MCP server running on http://localhost:3000');
  console.log('[CircuLink] 6 agents: Intake, Verification, Sourcing, Matching, Logistics, Prediction');
  console.log('[CircuLink] MCP endpoint: POST /mcp');
  console.log('[CircuLink] Open NitroStudio to test tools interactively');
}

bootstrap().catch((error) => {
  console.error('[CircuLink] Failed to start:', error);
  process.exit(1);
});
