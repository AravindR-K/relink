"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const core_1 = require("@nitrostack/core");
const intake_module_js_1 = require("./servers/intake-server/intake.module.js");
const verification_module_js_1 = require("./servers/verification-server/verification.module.js");
const sourcing_module_js_1 = require("./servers/sourcing-server/sourcing.module.js");
const matching_module_js_1 = require("./servers/matching-server/matching.module.js");
const logistics_module_js_1 = require("./servers/logistics-server/logistics.module.js");
const compliance_module_js_1 = require("./servers/compliance-server/compliance.module.js");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, core_1.McpApp)({
        module: AppModule,
        server: { name: 'circu-link', version: '1.0.0' },
        transport: { type: 'http', http: { port: 3000 } },
        logging: { level: 'info' },
    }),
    (0, core_1.Module)({
        name: 'AppModule',
        imports: [
            intake_module_js_1.IntakeModule,
            verification_module_js_1.VerificationModule,
            sourcing_module_js_1.SourcingModule,
            matching_module_js_1.MatchingModule,
            logistics_module_js_1.LogisticsModule,
            compliance_module_js_1.ComplianceModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map