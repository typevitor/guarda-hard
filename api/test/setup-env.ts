import os from 'node:os';
import path from 'node:path';

if (!process.env.SESSION_TOKEN_SECRET?.trim()) {
  process.env.SESSION_TOKEN_SECRET = 'test-session-secret';
}

if (!process.env.DATABASE_PATH) {
  process.env.DATABASE_PATH = path.join(
    os.tmpdir(),
    `guarda-hard-test-${process.pid}.sqlite`,
  );
}
