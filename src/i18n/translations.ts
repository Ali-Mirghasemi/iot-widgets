import type { Locale, WidgetCategory } from '../widgets/core/types';

export const uiText = {
  en: {
    title: 'IoT Widget Studio', subtitle: 'A modular catalogue for production IoT dashboards', search: 'Search widgets…',
    all: 'All', theme: 'Widget theme', language: 'Language', category: 'Category', widgets: 'widgets',
    fields: 'Data fields', sizes: 'Supported sizes', direction: 'Direction', capabilities: 'Capabilities', inspect: 'Inspect widget',
    noResults: 'No widgets match the current filters.',
  },
  fa: {
    title: 'استودیوی ویجت‌های IoT', subtitle: 'کاتالوگ ماژولار برای داشبوردهای عملیاتی اینترنت اشیا', search: 'جست‌وجوی ویجت…',
    all: 'همه', theme: 'تم ویجت', language: 'زبان', category: 'دسته‌بندی', widgets: 'ویجت',
    fields: 'فیلدهای داده', sizes: 'اندازه‌های پشتیبانی‌شده', direction: 'جهت', capabilities: 'قابلیت‌ها', inspect: 'مشاهده مشخصات',
    noResults: 'ویجتی با فیلترهای فعلی پیدا نشد.',
  },
} as const;

export const categoryLabels: Record<WidgetCategory, { en: string; fa: string }> = {
  metrics: { en: 'Metrics & Sensors', fa: 'سنسورها و مقادیر' },
  controls: { en: 'Controls', fa: 'کنترل‌ها' },
  charts: { en: 'Charts & History', fa: 'نمودار و تاریخچه' },
  location: { en: 'Location', fa: 'موقعیت مکانی' },
  tables: { en: 'Tables & Events', fa: 'جدول و رویدادها' },
  display: { en: 'Display & Custom', fa: 'نمایش و سفارشی' },
};

export const tr = (locale: Locale) => uiText[locale];
