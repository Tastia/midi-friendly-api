import { Logger } from '@nestjs/common';

export async function rateLimitPromiseQueue<T = any>(
  promises: Array<(options?: { signal?: AbortSignal }) => Promise<T>>,
  options: { concurrency: number; interval: number; runsPerInterval: number },
): Promise<[T[], any[]]> {
  return new Promise(async (resolve, reject) => {
    Logger.debug(
      `Rate limiting ${promises.length} promises with concurrency ${options.concurrency} and interval ${options.interval}ms`,
      'rateLimitPromiseQueue',
    );
    try {
      const PQueue = (await import('p-queue')).default;
      const success = [];
      const errors = [];
      const queue = new PQueue({
        concurrency: options.concurrency,
        interval: options.interval,
        intervalCap: options.runsPerInterval,
      });

      queue.on('error', (error) => Logger.error(error, 'rateLimitPromiseQueue'));
      queue.on('completed', (result) => {
        success.push(result);
        Logger.debug(
          `Promise completed, ${queue.size} remaining, ${queue.pending} pending`,
          'rateLimitPromiseQueue',
        );
      });
      queue.on('empty', () => resolve([success, errors]));
      queue.on('error', (error) => errors.push(error));
      queue.addAll(promises);
    } catch (err) {
      reject(err);
    }
  });
}
