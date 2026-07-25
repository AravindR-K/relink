"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingMiddleware = void 0;
const core_1 = require("@nitrostack/core");
let LoggingMiddleware = class LoggingMiddleware {
    async use(context, next) {
        const start = Date.now();
        const toolName = context.toolName || 'unknown';
        context.logger.info(`[${toolName}] Started`);
        try {
            const result = await next();
            const duration = Date.now() - start;
            context.logger.info(`[${toolName}] Completed in ${duration}ms`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - start;
            context.logger.error(`[${toolName}] Failed after ${duration}ms`, {
                error: error.message,
            });
            throw error;
        }
    }
};
exports.LoggingMiddleware = LoggingMiddleware;
exports.LoggingMiddleware = LoggingMiddleware = __decorate([
    (0, core_1.Middleware)()
], LoggingMiddleware);
//# sourceMappingURL=logging.middleware.js.map