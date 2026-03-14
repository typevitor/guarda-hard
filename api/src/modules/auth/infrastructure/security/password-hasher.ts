import { Injectable } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

@Injectable()
export class PasswordHasher {
  hash(value: string): Promise<string> {
    return Promise.resolve(createHash('sha256').update(value).digest('hex'));
  }

  async verify(plain: string, hashed: string): Promise<boolean> {
    const plainHash = await this.hash(plain);
    const left = Buffer.from(plainHash);
    const right = Buffer.from(hashed);

    if (left.length !== right.length) {
      return false;
    }

    return timingSafeEqual(left, right);
  }
}
