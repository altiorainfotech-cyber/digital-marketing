/**
 * Test URL Conversion
 */

import { getPublicUrl } from '../lib/config';

const testUrls = [
  'r2://digitalmarketing/videos/cml99q18i000mi6ouq1qzjog1',
  'r2://digitalmarketing/images/test.jpg',
  'https://example.com/test.mp4',
];

console.log('Testing URL conversion:\n');

testUrls.forEach(url => {
  const publicUrl = getPublicUrl(url);
  console.log(`Input:  ${url}`);
  console.log(`Output: ${publicUrl}`);
  console.log('---');
});
