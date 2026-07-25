"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleGuard = void 0;
class RoleGuard {
    allowedRoles;
    constructor(allowedRoles) {
        this.allowedRoles = allowedRoles;
    }
    canActivate(context) {
        const scopes = context.auth?.scopes || [];
        if (this.allowedRoles.length === 0)
            return true;
        return this.allowedRoles.some((role) => scopes.includes(role));
    }
}
exports.RoleGuard = RoleGuard;
//# sourceMappingURL=role.guard.js.map