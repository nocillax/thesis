import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Checks the isAdmin boolean from the JWT strategy
    if (user && user.isAdmin === true) {
      return true;
    }

    throw new ForbiddenException('Admin privileges required');
  }
}
