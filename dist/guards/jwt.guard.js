"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtGuard = void 0;
class JwtGuard {
    canActivate(context) {
        const authHeader = context.metadata?.authorization;
        if (!authHeader) {
            return true;
        }
        const token = authHeader.replace('Bearer ', '');
        context.auth = {
            subject: 'authenticated-user',
        };
        return true;
    }
}
exports.JwtGuard = JwtGuard;
//# sourceMappingURL=jwt.guard.js.map