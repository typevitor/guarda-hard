if (!process.env.SESSION_TOKEN_SECRET?.trim()) {
  process.env.SESSION_TOKEN_SECRET = 'test-session-secret';
}
