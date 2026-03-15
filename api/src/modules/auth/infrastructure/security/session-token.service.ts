import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24 hours

type SessionPayload = {
  userId: string;
  empresaId?: string;
  iat?: number;
  exp?: number;
};

@Injectable()
export class SessionTokenService {
  private readonly secret: string;
  private readonly expirySeconds: number;

  constructor() {
    const secret = process.env.SESSION_TOKEN_SECRET?.trim();
    if (!secret) {
      throw new Error('SESSION_TOKEN_SECRET must be set');
    }

    this.secret = secret;
    const configured = parseInt(
      process.env.SESSION_TOKEN_EXPIRY_SECONDS ?? '',
      10,
    );
    this.expirySeconds = isNaN(configured)
      ? DEFAULT_TOKEN_EXPIRY_SECONDS
      : configured;
  }

  sign(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: SessionPayload = {
      ...payload,
      iat: now,
      exp: now + this.expirySeconds,
    };
    const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString(
      'base64url',
    );
    const signature = this.signData(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  verify(token: string): Omit<SessionPayload, 'iat' | 'exp'> | null {
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

      if (parsed.exp !== undefined) {
        const now = Math.floor(Date.now() / 1000);
        if (now >= parsed.exp) {
          return null;
        }
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
