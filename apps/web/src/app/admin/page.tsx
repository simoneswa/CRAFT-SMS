import React from 'react';
import prisma from '@/lib/prisma';
import SuperAdminClient from './SuperAdminClient';
import { Slip } from '@craft-sms/database';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  let videoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
  let serializedSlips: any[] = [];

  try {
    // 1. Fetch live video config URL row from news_feed
    const videoConfig = await prisma.news_feed.findFirst({
      where: {
        isGlobal: true,
        title: 'System Video URL Config',
      },
    });
    videoUrl = videoConfig?.imageUrl || 'https://www.w3schools.com/html/mov_bbb.mp4';

    // 2. Fetch all slips across multi-tenant database for readonly support log
    const slips = await prisma.slips.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert slips Decimal types to standard JSON-serializable structures for Client component safety
    serializedSlips = slips.map((slip: Slip) => ({
      id: slip.id,
      schoolId: slip.schoolId,
      slipNumber: slip.slipNumber,
      amount: slip.amount.toString(), // Convert Decimal to string
      status: slip.status,
      createdAt: slip.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error('Database connection failed in Admin panel, serving offline mode:', error);
  }

  return (
    <SuperAdminClient 
      initialVideoUrl={videoUrl}
      slips={serializedSlips}
    />
  );
}
