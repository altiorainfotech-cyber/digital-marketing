import prisma from '../lib/prisma';
import { getPublicUrl } from '../lib/config';

async function checkAllVideoUrls() {
  try {
    console.log('Checking all video assets...\n');
    
    const videos = await prisma.asset.findMany({
      where: {
        assetType: 'VIDEO',
      },
      select: {
        id: true,
        title: true,
        storageUrl: true,
        fileSize: true,
        uploadedAt: true,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: 5,
    });
    
    console.log(`Found ${videos.length} video(s)\n`);
    
    if (videos.length === 0) {
      console.log('No videos found in database');
      return;
    }
    
    videos.forEach((video, index) => {
      console.log(`${index + 1}. ${video.title}`);
      console.log(`   ID: ${video.id}`);
      console.log(`   Storage URL: ${video.storageUrl}`);
      
      const publicUrl = getPublicUrl(video.storageUrl);
      console.log(`   Public URL: ${publicUrl}`);
      console.log(`   Size: ${video.fileSize ? (video.fileSize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}`);
      console.log(`   Uploaded: ${video.uploadedAt.toISOString()}`);
      console.log('');
    });
    
    console.log('\n📋 To test if videos are accessible:');
    videos.forEach((video, index) => {
      const publicUrl = getPublicUrl(video.storageUrl);
      console.log(`${index + 1}. curl -I "${publicUrl}"`);
    });
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllVideoUrls();
