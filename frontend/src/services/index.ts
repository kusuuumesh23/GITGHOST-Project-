import { Services } from './types.js';
import { httpServices } from './httpServices.js';
import { mockServices } from './mockServices.js';

const dataSource = import.meta.env.VITE_DATA_SOURCE || 'mock';

export const services: Services = dataSource === 'api' ? httpServices : mockServices;

export * from './types.js';
export { httpServices, mockServices };
