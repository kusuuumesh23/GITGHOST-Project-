import { env } from '../../config/env.js';
import { IDeepSeekProvider } from './deepseek.interface.js';
import { DeepSeekNIMClient } from './deepseek.client.js';
import { MockDeepSeekProvider } from './mock.provider.js';

export * from './deepseek.interface.js';

let deepSeekInstance: IDeepSeekProvider | null = null;

export function getDeepSeekProvider(): IDeepSeekProvider {
  if (deepSeekInstance) {
    return deepSeekInstance;
  }

  if (env.NVIDIA_NIM_API_KEY && env.NVIDIA_NIM_API_KEY.trim() !== '') {
    deepSeekInstance = new DeepSeekNIMClient();
  } else {
    deepSeekInstance = new MockDeepSeekProvider();
  }

  return deepSeekInstance;
}

export function setDeepSeekProvider(provider: IDeepSeekProvider): void {
  deepSeekInstance = provider;
}
