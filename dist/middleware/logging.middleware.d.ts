import { type ExecutionContext, type MiddlewareInterface } from '@nitrostack/core';
export declare class LoggingMiddleware implements MiddlewareInterface {
    use(context: ExecutionContext, next: () => Promise<void>): Promise<unknown>;
}
//# sourceMappingURL=logging.middleware.d.ts.map