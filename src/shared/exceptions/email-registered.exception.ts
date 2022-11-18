import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailRegisteredException extends HttpException {
  constructor() {
    super('Email already registered', HttpStatus.CONFLICT);
  }
}
