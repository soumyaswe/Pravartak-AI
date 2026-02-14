/**
 * Test script for URL validator with YouTube replacement
 * Run with: node lib/test-url-validator.js
 */

const { 
  validateUrl, 
  validateUrls, 
  validateAndFilterLinks,
  validateAndFilterLinksWithReplacement,
  findYouTubeAlternative,
  isYouTubeUrl, 
  validateYouTubeVideo 
} = require('./url-validator');

async function runTests() {
  console.log('🧪 Testing URL Validator...\n');

  // Test 1: Valid URL
  console.log('Test 1: Valid URL');
  const result1 = await validateUrl('https://www.google.com');
  console.log('Result:', result1);
  console.log('✅ Should be valid\n');

  // Test 2: Invalid URL (404)
  console.log('Test 2: Invalid URL (404)');
  const result2 = await validateUrl('https://www.google.com/this-page-does-not-exist-12345');
  console.log('Result:', result2);
  console.log('✅ Should be invalid (404)\n');

  // Test 3: Redirect URL
  console.log('Test 3: Redirect URL');
  const result3 = await validateUrl('http://github.com');
  console.log('Result:', result3);
  console.log('✅ Should redirect to https://github.com\n');

  // Test 4: YouTube URL Detection
  console.log('Test 4: YouTube URL Detection');
  console.log('youtube.com:', isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
  console.log('youtu.be:', isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'));
  console.log('Not YouTube:', isYouTubeUrl('https://vimeo.com/123456'));
  console.log('✅ Should correctly identify YouTube URLs\n');

  // Test 5: Valid YouTube Video
  console.log('Test 5: Valid YouTube Video');
  const result5 = await validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  console.log('Result:', result5);
  console.log('✅ Should be valid (famous video)\n');

  // Test 6: Invalid YouTube Video (likely deleted)
  console.log('Test 6: Find YouTube Alternative for unavailable video');
  const result6 = await findYouTubeAlternative(
    'https://www.youtube.com/watch?v=deleted123',
    'JavaScript Tutorial - Basics'
  );
  console.log('Result:', result6);
  console.log('✅ Should generate search alternative\n');

  // Test 7: Multiple URLs including YouTube
  console.log('Test 7: Multiple URLs including YouTube');
  const urls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Valid YouTube
    'https://www.example.com', // Valid regular site
    'https://invalid-url-that-does-not-exist-12345.com', // Invalid
    'https://developer.mozilla.org', // Valid
  ];
  const validUrls = await validateUrls(urls, 2);
  console.log('Valid URLs:', validUrls);
  console.log('✅ Should filter out invalid URLs\n');

  // Test 8: Markdown with YouTube links
  console.log('Test 8: Validate markdown with YouTube replacement');
  const markdown = `
# Sample Content

Here are some resources:

**Resources:**
- [JavaScript Basics Tutorial](https://www.youtube.com/watch?v=invalidvideo123) — YouTube video
- [MDN Docs](https://developer.mozilla.org) — Documentation
- [Broken Link](https://this-does-not-exist-12345.com) — Should be removed

Some plain text here.
`;

  const result8 = await validateAndFilterLinksWithReplacement(markdown, true);
  console.log('Original text length:', markdown.length);
  console.log('Validated text length:', result8.validatedText.length);
  console.log('Original URLs:', result8.originalCount);
  console.log('Valid URLs:', result8.validCount);
  console.log('Replaced URLs:', result8.replacedCount);
  console.log('\nValidated markdown:');
  console.log(result8.validatedText);
  console.log('✅ Should replace broken YouTube with search, remove broken link\n');

  // Test 9: Validate without replacement
  console.log('Test 9: Validate without YouTube replacement');
  const result9 = await validateAndFilterLinksWithReplacement(markdown, false);
  console.log('Original URLs:', result9.originalCount);
  console.log('Valid URLs:', result9.validCount);
  console.log('Replaced URLs:', result9.replacedCount);
  console.log('✅ Should not replace, just remove invalid links\n');

  // Test 10: General resource replacement (articles, blogs, docs)
  console.log('\n📝 Test 10: General resource replacement');
  const mixedMarkdown = `
# Resources
- [JavaScript Tutorial](https://example.com/broken-tutorial) — Tutorial
- [CSS Guide](https://example.com/404-guide) — Article
- [Python Docs](https://example.com/missing-docs) — Documentation
- [Valid Resource](https://www.google.com) — Article
  `;
  
  const generalResult = await validateAndFilterLinksWithReplacement(mixedMarkdown, true);
  console.log(`Original count: ${generalResult.originalCount}`);
  console.log(`Valid count: ${generalResult.validCount}`);
  console.log(`Replaced count: ${generalResult.replacedCount}`);
  console.log('Validated text:');
  console.log(generalResult.validatedText);
  console.log('✅ Test 10 completed');

  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);
