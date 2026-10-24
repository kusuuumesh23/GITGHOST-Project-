import { beforeAll, afterAll } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.PORT = '5002';
process.env.JWT_SECRET = 'test-jwt-secret-for-vitest-suite-minimum-32-chars';
process.env.TINYFISH_API_KEY = ''; // Uses mock provider in tests
process.env.NVIDIA_NIM_API_KEY = ''; // Uses mock provider in tests
process.env.IMAGE_PROVIDER = 'mock';
process.env.TOKEN_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.LINKEDIN_CLIENT_ID = 'mock-linkedin-id';
process.env.LINKEDIN_CLIENT_SECRET = 'mock-linkedin-secret';
process.env.X_CLIENT_ID = 'mock-x-id';
process.env.X_CLIENT_SECRET = 'mock-x-secret';

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test teardown
});
