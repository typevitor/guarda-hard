import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

type SessionPayload = {
  userId: string;
  empresaId?: string;
};

@Injectable()
export class SessionTokenService {
  private readonly secret = process.env.SESSION_TOKEN_SECRET ?? 'dev-session-secret';

  sign(payload: SessionPayload): string {
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.signData(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): SessionPayload | null {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      return null;
    }

    const expected = this.signData(encodedPayload);
    const left = Buffer.from(signature);
    const right = Buffer.from(expected);

    if (left.length !== right.length || !timingSafeEqual(left, right)) {
      return null;
    }

    try {
      const parsed = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as Partial<SessionPayload>;

      if (!parsed.userId) {
        return null;
      }

      return {
        userId: parsed.userId,
        empresaId: parsed.empresaId,
      };
    } catch {
      return null;
    }
  }

  private signData(value: string): string {
    return createHmac('sha256', this.secret).update(value).digest('base64url');
  }
}
