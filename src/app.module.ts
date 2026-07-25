import { Module } from '@nitrostack/core';
import { IntakeModule } from './servers/intake-server/intake.module.js';
import { VerificationModule } from './servers/verification-server/verification.module.js';
import { SourcingModule } from './servers/sourcing-server/sourcing.module.js';
import { MatchingModule } from './servers/matching-server/matching.module.js';
import { LogisticsModule } from './servers/logistics-server/logistics.module.js';
import { ComplianceModule } from './servers/compliance-server/compliance.module.js';

@Module({
  name: 'AppModule',
  imports: [
    IntakeModule,
    VerificationModule,
    SourcingModule,
    MatchingModule,
    LogisticsModule,
    ComplianceModule,
  ],
})
export class AppModule {}
