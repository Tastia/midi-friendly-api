import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Access guard for Nest authentication mechanism
 */
@Injectable()
export class AccessGuard implements CanActivate {
  private reflector: Reflector;
  constructor() {
    this.reflector = new Reflector();
  }

  /**
   * Check if this method can be activated with given execution context
   * @param context
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return true;
  }
}
