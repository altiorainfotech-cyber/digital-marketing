import { getPublicUrl } from '../lib/config';

function testPublicUrlConversion() {
  console.log('Testing public URL conversion...\n');
  
  const testUrls = [
    'r2://digitalmarketing/videos/cml96cni70000i6ouw6r79uhx',
    'r2://digitalmarketing/images/test.jpg',
    'https://example.com/video.mp4',
  ];
  
  console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
  console.log('');
  
  testUrls.forEach(url => {
    const publicUrl = getPublicUrl(url);
    console.log('Input: ', url);
    console.log('Output:', publicUrl);
    console.log('');
  });
}

testPublicUrlConversion();
