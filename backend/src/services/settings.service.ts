import { prisma } from '../db/prisma.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { isValidTimezone } from '../utils/timezone.js';

export class SettingsService {
  async getByBusinessId(businessId: string) {
    let settings = await prisma.businessSettings.findUnique({
      where: { businessId },
    });

    if (!settings) {
      settings = await prisma.businessSettings.create({
        data: {
          businessId,
          timezone: 'UTC',
          defaultPlatform: 'INSTAGRAM',
        },
      });
    }

    return settings;
  }

  async update(
    businessId: string,
    data: Partial<{
      timezone: string;
      defaultPlatform: string;
      defaultLanguage: string;
      notificationsEnabled: boolean;
      dailyReminderTime: string;
      theme: string;
    }>
  ) {
    if (data.timezone && !isValidTimezone(data.timezone)) {
      throw new BadRequestError(`Invalid timezone identifier: ${data.timezone}`);
    }

    return prisma.businessSettings.upsert({
      where: { businessId },
      update: data,
      create: {
        businessId,
        timezone: data.timezone || 'UTC',
        defaultPlatform: data.defaultPlatform || 'INSTAGRAM',
        defaultLanguage: data.defaultLanguage || 'en',
        notificationsEnabled: data.notificationsEnabled ?? true,
        dailyReminderTime: data.dailyReminderTime || '09:00',
        theme: data.theme || 'system',
      },
    });
  }
}

export const settingsService = new SettingsService();
