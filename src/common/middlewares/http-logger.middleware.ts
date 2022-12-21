import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const startAt = process.hrtime();
    const { ip, method, path } = request;
    const userAgent = request.get('user-agent') || '';

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const diff = process.hrtime(startAt);
      const responseTime = diff[0] * 1e3 + diff[1] * 1e-6;
      // generate uuid
      const requestId = new Types.ObjectId();
      this.logger.log(
        `${requestId} ${method} ${path} ${statusCode} ${responseTime}ms ${contentLength} - ${userAgent} ${ip}`,
      );
      request.body &&
        this.logger.log(`${requestId} - REQUEST BODY: ${this.formatBody(request.body)}`);
    });

    next();
  }

  formatBody(body: { [key: string]: any }): string {
    try {
      const stringified = JSON.stringify(body, null, 4);
      return stringified.length > 1000 ? `${stringified.substr(0, 1000)}...` : stringified;
    } catch (err) {
      return 'UNPARSABLE JSON';
    }
  }
}
