import { type ExecutionContext, type MiddlewareInterface } from '@nitrostack/core';
export declare class RequestIdMiddleware implements MiddlewareInterface {
    use(context: ExecutionContext, next: () => Promise<void>): Promise<unknown>;
}
//# sourceMappingURL=request-id.middleware.d.ts.map