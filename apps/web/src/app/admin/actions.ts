"use server";

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

/**
 * Super Admin Action: Upsert homepage promotion video URL
 */
export async function updateVideoUrl(videoUrl: string) {
  if (!videoUrl.trim()) {
    throw new Error('Video URL cannot be empty');
  }

  const existing = await prisma.news_feed.findFirst({
    where: {
      isGlobal: true,
      title: 'System Video URL Config',
    },
  });

  if (existing) {
    await prisma.news_feed.update({
      where: { id: existing.id },
      data: {
        imageUrl: videoUrl,
        content: 'Homepage system promotional core video stream config',
      },
    });
  } else {
    await prisma.news_feed.create({
      data: {
        title: 'System Video URL Config',
        content: 'Homepage system promotional core video stream config',
        imageUrl: videoUrl,
        isGlobal: true,
      },
    });
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Super Admin Action: Publish global announcement card
 */
export async function publishAnnouncement(title: string, content: string, imageUrl?: string) {
  if (!title.trim() || !content.trim()) {
    throw new Error('Title and content are required');
  }

  await prisma.news_feed.create({
    data: {
      title,
      content,
      imageUrl: imageUrl?.trim() || null,
      isGlobal: true,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Super Admin Action: Publish Student of the Week leaderboard notice
 */
export async function publishLeaderboard(title: string, content: string, schoolId: string, targetId?: string) {
  if (!title.trim() || !content.trim() || !schoolId.trim()) {
    throw new Error('Student name, achievement content, and School ID are required');
  }

  // Notice table has @id @db.Uuid without a default, so we generate a random UUID
  const id = crypto.randomUUID();

  await prisma.notices.create({
    data: {
      id,
      schoolId,
      title, // Student Name
      content, // Achievement details
      type: 'leaderboard',
      targetId: targetId?.trim() || null,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}
