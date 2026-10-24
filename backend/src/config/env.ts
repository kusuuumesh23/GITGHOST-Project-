import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5001').transform(Number),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().default('postgresql://postgres:postgres@localhost:5432/postdaily?schema=public'),

  JWT_SECRET: z.string().default('postdaily-dev-jwt-secret-do-not-use-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  TINYFISH_API_KEY: z.string().optional().default(''),
  TINYFISH_BASE_URL: z.string().default('https://agent.tinyfish.ai'),
  TINYFISH_TIMEOUT_MS: z.string().default('60000').transform(Number),

  NVIDIA_NIM_API_KEY: z.string().optional().default(''),
  NVIDIA_NIM_BASE_URL: z.string().default('https://integrate.api.nvidia.com/v1'),
  NVIDIA_NIM_MODEL: z.string().default('deepseek-ai/deepseek-r1'),
  NVIDIA_NIM_TIMEOUT_MS: z.string().default('45000').transform(Number),

  IMAGE_STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  LOCAL_STORAGE_DIR: z.string().default('./uploads/assets'),
  IMAGE_PROVIDER: z.string().default('mock'),
  IMAGE_PROVIDER_API_KEY: z.string().optional().default(''),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  CRAWL_RATE_LIMIT_MAX: z.string().default('10').transform(Number),
  GENERATION_RATE_LIMIT_MAX: z.string().default('20').transform(Number),

  // Social OAuth
  REDIRECT_BASE_URL: z.string().default('http://localhost:5001'),
  TOKEN_ENCRYPTION_KEY: z.string().default('0000000000000000000000000000000000000000000000000000000000000000'), // 64 hex chars = 32 bytes

  // LinkedIn OAuth 2.0
  LINKEDIN_CLIENT_ID: z.string().optional().default(''),
  LINKEDIN_CLIENT_SECRET: z.string().optional().default(''),

  // X (Twitter) OAuth 2.0 with PKCE
  X_CLIENT_ID: z.string().optional().default(''),
  X_CLIENT_SECRET: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Invalid environment configuration');
  }
}

export const env = parsedEnv.success ? parsedEnv.data : envSchema.parse({});
