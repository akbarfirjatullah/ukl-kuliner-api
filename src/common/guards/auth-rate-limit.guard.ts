import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private readonly maxRequests = 5;
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = this.getRequestIp(request);
    const routeKey = context.getHandler().name;
    const bucketKey = `${ip}:${routeKey}`;
    const now = Date.now();

    this.cleanupExpiredBuckets(now);

    const bucket = this.buckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(bucketKey, {
        count: 1,
        resetAt: now + this.windowMs
      });

      return true;
    }

    if (bucket.count >= this.maxRequests) {
      const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);

      throw new HttpException(
        `Terlalu banyak percobaan login/registrasi. Coba lagi dalam ${retryAfterSeconds} detik.`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    bucket.count += 1;
    this.buckets.set(bucketKey, bucket);

    return true;
  }

  private cleanupExpiredBuckets(now: number) {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  private getRequestIp(request: Record<string, unknown>) {
    const forwardedFor = request.headers && (request.headers as Record<string, unknown>)['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim() !== '') {
      return forwardedFor.split(',')[0].trim();
    }

    const ip = request.ip;
    if (typeof ip === 'string' && ip.trim() !== '') {
      return ip;
    }

    const socket = request.socket as { remoteAddress?: unknown } | undefined;
    if (socket && typeof socket.remoteAddress === 'string' && socket.remoteAddress.trim() !== '') {
      return socket.remoteAddress;
    }

    return 'unknown';
  }
}
