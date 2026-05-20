import { PrismaClient, prisma as db } from '@craft-sms/database';

export type ExtendedPrismaClient = PrismaClient & {
  news_feed: PrismaClient['newsFeed'];
  notices: PrismaClient['notice'];
  slips: PrismaClient['slip'];
};

const extendedPrisma = new Proxy(db, {
  get(target, prop, receiver) {
    if (prop === 'news_feed') {
      return (target as any).newsFeed;
    }
    if (prop === 'notices') {
      return (target as any).notice;
    }
    if (prop === 'slips') {
      return (target as any).slip;
    }
    return Reflect.get(target, prop, receiver);
  }
}) as unknown as ExtendedPrismaClient;

export default extendedPrisma;
