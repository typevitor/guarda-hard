import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

@Injectable()
export class PasswordHasher {
  hash(value: string): Promise<string> {
    return bcrypt.hash(value, SALT_ROUNDS);
  }

  verify(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
