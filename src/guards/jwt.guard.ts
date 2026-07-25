import { type ExecutionContext, type Guard } from '@nitrostack/core';

export class JwtGuard implements Guard {
  canActivate(context: ExecutionContext): boolean {
    const authHeader = context.metadata?.authorization as string | undefined;

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
