import prisma from '@/lib/prisma';
import { Suspense } from 'react';
import InteractiveLanding from './InteractiveLanding';
import { NewsFeed } from '@craft-sms/database';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  let newsFeed: NewsFeed[] = [];
  let videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
  let leaderboardNotice = null;

  try {
    // 1. Fetch global news feed entries from the database via Prisma
    newsFeed = await prisma.news_feed.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: 'desc' },
    });

    // 2. Dynamic Video URL Stream configuration row
    const videoConfig = await prisma.news_feed.findFirst({
      where: {
        isGlobal: true,
        title: 'System Video URL Config',
      },
    });
    if (videoConfig?.imageUrl) {
      videoUrl = videoConfig.imageUrl;
    }

    // 3. Dynamic Automated System Leaderboard Engine notices query
    const leaderboardNotices = await prisma.notices.findMany({
      where: { type: 'leaderboard' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    leaderboardNotice = leaderboardNotices[0] || null;
  } catch (error) {
    console.error('Database connection failed, using offline placeholders:', error);
    // Fallback offline mock elements to keep build resilient
    newsFeed = [
      {
        id: 'offline-news-1',
        schoolId: null,
        authorId: null,
        title: 'CRAFT SMS Sovereign Core Online',
        description: 'The national records system is operating in light-adaptive local synchronization mode.',
        content: 'The database connection is currently undergoing standard network synchronization. Local service workers are serving system frameworks. Offline workspace registries remain fully secure.',
        imageUrl: null,
        badgeColor: 'sky',
        icon: 'Globe',
        isGlobal: true,
        createdAt: new Date(),
      }
    ];
  }

  // Filter out the video config row from the main news feed display
  const displayNews = newsFeed.filter((item: NewsFeed) => item.title !== 'System Video URL Config');

  // Render the page with the loaded data
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-900 font-medium">Loading CRAFT SMS...</div>}>
      <InteractiveLanding 
        newsFeed={displayNews} 
        initialVideoUrl={videoUrl}
        leaderboard={leaderboardNotice}
      />
    </Suspense>
  );
}
