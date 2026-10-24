import { env } from '../../config/env.js';
import { ITinyFishProvider } from './tinyfish.interface.js';
import { TinyFishClient } from './tinyfish.client.js';
import { MockTinyFishProvider } from './mock.provider.js';

export * from './tinyfish.interface.js';

let tinyFishInstance: ITinyFishProvider | null = null;

export function getTinyFishProvider(): ITinyFishProvider {
  if (tinyFishInstance) {
    return tinyFishInstance;
  }

  // Use real client if API key is supplied, or mock provider in development/test
  if (env.TINYFISH_API_KEY && env.TINYFISH_API_KEY.trim() !== '') {
    tinyFishInstance = new TinyFishClient();
  } else {
    tinyFishInstance = new MockTinyFishProvider();
  }

  return tinyFishInstance;
}

export function setTinyFishProvider(provider: ITinyFishProvider): void {
  tinyFishInstance = provider;
}
