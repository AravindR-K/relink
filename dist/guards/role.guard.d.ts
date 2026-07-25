import { type ExecutionContext, type Guard } from '@nitrostack/core';
export declare class RoleGuard implements Guard {
    private readonly allowedRoles;
    constructor(allowedRoles: string[]);
    canActivate(context: ExecutionContext): boolean;
}
//# sourceMappingURL=role.guard.d.ts.map