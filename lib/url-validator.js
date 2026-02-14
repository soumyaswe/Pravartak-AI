/**
 * URL Validation Utility
 * 
 * Validates resource links to ensure they are working and accessible.
 * - Filters out 4xx, 5xx errors and connection failures
 * - Follows 3xx redirects and returns final destination URL
 * - Uses HEAD requests for efficiency with 5-second timeout
 * - Returns clean array of unique, working URLs as strings
 * - Special handling for YouTube videos (checks availability)
 */

/**
 * Checks if a URL is a YouTube video URL
 * @param {string} url - The URL to check
 * @returns {boolean} - True if it's a YouTube URL
 */
function isYouTubeUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    return hostname === 'youtube.com' || 
           hostname === 'www.youtube.com' || 
           hostname === 'youtu.be' || 
           hostname === 'm.youtube.com';
  } catch (e) {
    return false;
  }
}

/**
 * Validates YouTube video availability
 * @param {string} url - The YouTube URL to validate
 * @returns {Promise<{isValid: boolean, finalUrl: string|null, error: string|null}>}
 */
async function validateYouTubeVideo(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for YouTube

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      });

      clearTimeout(timeoutId);

      // Check for error status codes
      if (response.status === 404 || response.status === 410) {
        return { isValid: false, finalUrl: null, error: 'Video not found (404/410)' };
      }

      if (!response.ok) {
        return { isValid: false, finalUrl: null, error: `HTTP ${response.status}` };
      }

      // Get the response body to check for unavailability indicators
      const html = await response.text();

      // Check for common YouTube unavailability indicators
      const unavailableIndicators = [
        'Video unavailable',
        'This video is unavailable',
        'This video has been removed',
        'This video is private',
        'This video has been deleted',
        'This video is no longer available',
        '"playabilityStatus":{"status":"ERROR"',
        '"playabilityStatus":{"status":"UNPLAYABLE"',
        '"playabilityStatus":{"status":"LOGIN_REQUIRED"',
        'Private video',
      ];

      const lowerHtml = html.toLowerCase();
      for (const indicator of unavailableIndicators) {
        if (lowerHtml.includes(indicator.toLowerCase())) {
          return { 
            isValid: false, 
            finalUrl: null, 
            error: `YouTube video unavailable: ${indicator}` 
          };
        }
      }

      // Check if the response contains valid video metadata
      const hasVideoMetadata = html.includes('"videoDetails"') || 
                              html.includes('og:video') ||
                              html.includes('itemprop="video"');

      if (!hasVideoMetadata) {
        return { 
          isValid: false, 
          finalUrl: null, 
          error: 'No valid video metadata found' 
        };
      }

      // Video appears to be available
      const finalUrl = response.url || url;
      return { isValid: true, finalUrl, error: null };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return { isValid: false, finalUrl: null, error: 'Timeout' };
      }

      return { 
        isValid: false, 
        finalUrl: null, 
        error: fetchError.message || 'Connection failed' 
      };
    }
  } catch (error) {
    return { 
      isValid: false, 
      finalUrl: null, 
      error: error.message || 'Unknown error' 
    };
  }
}

/**
 * Validates a single URL
 * @param {string} url - The URL to validate
 * @returns {Promise<{isValid: boolean, finalUrl: string|null, error: string|null}>}
 */
async function validateUrl(url) {
  try {
    // Validate URL format first
    try {
      new URL(url);
    } catch (e) {
      return { isValid: false, finalUrl: null, error: 'Invalid URL format' };
    }

    // Special handling for YouTube URLs
    if (isYouTubeUrl(url)) {
      return await validateYouTubeVideo(url);
    }

    // Use fetch with HEAD method for efficiency
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'follow', // Automatically follow redirects
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)',
        },
      });

      clearTimeout(timeoutId);

      // Check for successful status codes (2xx and 3xx)
      if (response.ok || (response.status >= 300 && response.status < 400)) {
        // Get the final URL after redirects
        const finalUrl = response.url || url;
        return { isValid: true, finalUrl, error: null };
      } else {
        return { 
          isValid: false, 
          finalUrl: null, 
          error: `HTTP ${response.status}` 
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (fetchError.name === 'AbortError') {
        return { isValid: false, finalUrl: null, error: 'Timeout' };
      }

      // Try GET as fallback (some servers don't support HEAD)
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller2.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; LinkValidator/1.0)',
          },
        });

        clearTimeout(timeoutId2);

        if (response.ok) {
          const finalUrl = response.url || url;
          return { isValid: true, finalUrl, error: null };
        } else {
          return { 
            isValid: false, 
            finalUrl: null, 
            error: `HTTP ${response.status}` 
          };
        }
      } catch (getFetchError) {
        clearTimeout(timeoutId);
        return { 
          isValid: false, 
          finalUrl: null, 
          error: fetchError.message || 'Connection failed' 
        };
      }
    }
  } catch (error) {
    return { 
      isValid: false, 
      finalUrl: null, 
      error: error.message || 'Unknown error' 
    };
  }
}

/**
 * Validates multiple URLs in parallel (with concurrency limit)
 * @param {string[]} urls - Array of URLs to validate
 * @param {number} concurrency - Maximum concurrent requests (default: 5)
 * @returns {Promise<string[]>} - Array of valid URLs (with final destinations after redirects)
 */
async function validateUrls(urls, concurrency = 5) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return [];
  }

  // Remove duplicates
  const uniqueUrls = [...new Set(urls)];
  
  // Validate URLs with concurrency limit
  const results = [];
  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const batch = uniqueUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => validateUrl(url))
    );
    results.push(...batchResults);
  }

  // Filter valid URLs and return final destinations
  const validUrls = results
    .filter(result => result.isValid && result.finalUrl)
    .map(result => result.finalUrl);

  // Remove duplicates again (in case redirects point to same URL)
  return [...new Set(validUrls)];
}

/**
 * Extracts topic/search query from a markdown resource link text
 * @param {string} linkText - The text part of a markdown link
 * @returns {string} - Clean search query
 */
function extractTopicFromLinkText(linkText) {
  // Remove common suffixes like " — YouTube video", " - Tutorial", etc.
  let topic = linkText
    .replace(/\s*[—–-]\s*(YouTube video|Video|Tutorial|Course|Playlist).*$/i, '')
    .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical notes
    .trim();
  
  return topic;
}

/**
 * Generates YouTube search URLs for a given topic
 * @param {string} topic - The topic to search for
 * @param {number} maxResults - Number of alternative URLs to generate (default: 3)
 * @returns {string[]} - Array of potential YouTube search result URLs
 */
function generateYouTubeAlternatives(topic, maxResults = 3) {
  if (!topic || typeof topic !== 'string') {
    return [];
  }

  const alternatives = [];
  const cleanTopic = topic.trim();
  
  // Strategy 1: Popular educational channels known for quality content
  const educationalChannels = [
    'freeCodeCamp',
    'Traversy Media',
    'Programming with Mosh',
    'The Net Ninja',
    'Fireship',
    'Tech With Tim',
    'Web Dev Simplified',
    'Academind',
    'Corey Schafer',
    'CS Dojo',
  ];

  // Strategy 2: Add common educational keywords to improve results
  const educationalKeywords = [
    'tutorial',
    'course',
    'learn',
    'crash course',
    'full course',
  ];

  // Generate search queries with channel names
  const channelQueries = educationalChannels.slice(0, 2).map(channel => 
    `${cleanTopic} ${channel}`
  );

  // Generate search queries with educational keywords
  const keywordQueries = educationalKeywords.slice(0, 2).map(keyword =>
    `${cleanTopic} ${keyword}`
  );

  // Combine and create YouTube search URLs
  const queries = [...channelQueries, ...keywordQueries, cleanTopic];
  
  queries.slice(0, maxResults).forEach(query => {
    const encodedQuery = encodeURIComponent(query);
    // Use YouTube search URL that will redirect to first result
    // Note: We'll construct common URL patterns that often work
    alternatives.push(`https://www.youtube.com/results?search_query=${encodedQuery}`);
  });

  return alternatives;
}

/**
 * Attempts to find a working YouTube video alternative for an unavailable video
 * @param {string} originalUrl - The original unavailable YouTube URL
 * @param {string} linkText - The descriptive text from the markdown link
 * @returns {Promise<{found: boolean, alternativeUrl: string|null, topic: string, isSearchUrl: boolean}>}
 */
async function findYouTubeAlternative(originalUrl, linkText) {
  try {
    // Extract topic from link text
    const topic = extractTopicFromLinkText(linkText);
    
    if (!topic) {
      console.log('Could not extract topic from link text');
      return { found: false, alternativeUrl: null, topic: '', isSearchUrl: false };
    }

    console.log(`Searching for alternative YouTube video for topic: "${topic}"`);

    // Try to get alternatives from trusted channels
    const searchUrls = await searchTrustedChannels(topic);
    
    if (searchUrls.length > 0) {
      // Return the first search URL as an alternative
      // This provides users with a direct search link to find relevant content
      const searchUrl = searchUrls[0];
      console.log(`Generated search alternative: ${searchUrl}`);
      
      // Return search URL - it's not a direct video, but it helps users find content
      return { 
        found: true, 
        alternativeUrl: searchUrl, 
        topic,
        isSearchUrl: true 
      };
    }

    // Fallback: generate generic YouTube search
    const genericSearch = `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' tutorial')}`;
    console.log(`Using generic search fallback: ${genericSearch}`);
    
    return { 
      found: true, 
      alternativeUrl: genericSearch, 
      topic,
      isSearchUrl: true 
    };

  } catch (error) {
    console.error('Error finding YouTube alternative:', error);
    return { found: false, alternativeUrl: null, topic: '', isSearchUrl: false };
  }
}

/**
 * Generates alternative resource URLs for non-YouTube content
 * @param {string} topic - The topic to search for
 * @param {string} resourceType - Type of resource (article, blog, docs, course, etc.)
 * @returns {string[]} - Array of alternative resource URLs
 */
function generateAlternativeResources(topic, resourceType = 'article') {
  const alternatives = [];
  const cleanTopic = topic.trim();
  
  // Common free, high-quality resource platforms based on type
  const resourcePlatforms = {
    article: [
      { name: 'freeCodeCamp News', url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(cleanTopic)}` },
      { name: 'Dev.to', url: `https://dev.to/search?q=${encodeURIComponent(cleanTopic)}` },
      { name: 'Medium', url: `https://medium.com/search?q=${encodeURIComponent(cleanTopic)}` },
    ],
    blog: [
      { name: 'Dev.to', url: `https://dev.to/search?q=${encodeURIComponent(cleanTopic)}` },
      { name: 'Hashnode', url: `https://hashnode.com/search?q=${encodeURIComponent(cleanTopic)}` },
      { name: 'freeCodeCamp', url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(cleanTopic)}` },
    ],
    docs: [
      { name: 'MDN', url: `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(cleanTopic)}` },
      { name: 'DevDocs', url: `https://devdocs.io/#q=${encodeURIComponent(cleanTopic)}` },
    ],
    tutorial: [
      { name: 'freeCodeCamp', url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(cleanTopic + ' tutorial')}` },
      { name: 'DigitalOcean', url: `https://www.digitalocean.com/community/tutorials?q=${encodeURIComponent(cleanTopic)}` },
      { name: 'Dev.to', url: `https://dev.to/search?q=${encodeURIComponent(cleanTopic + ' tutorial')}` },
    ],
    course: [
      { name: 'freeCodeCamp', url: `https://www.freecodecamp.org/learn` },
      { name: 'Codecademy', url: `https://www.codecademy.com/search?query=${encodeURIComponent(cleanTopic)}` },
      { name: 'Khan Academy', url: `https://www.khanacademy.org/search?page_search_query=${encodeURIComponent(cleanTopic)}` },
    ],
    guide: [
      { name: 'DigitalOcean', url: `https://www.digitalocean.com/community/tutorials?q=${encodeURIComponent(cleanTopic)}` },
      { name: 'freeCodeCamp', url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(cleanTopic + ' guide')}` },
    ],
  };

  // Determine resource type from link text or default to 'article'
  const type = resourceType.toLowerCase();
  let platforms = resourcePlatforms[type] || resourcePlatforms.article;

  // Add top result from each platform
  platforms.forEach(platform => {
    alternatives.push(platform.url);
  });

  // Add generic web search as ultimate fallback
  alternatives.push(`https://www.google.com/search?q=${encodeURIComponent(cleanTopic + ' ' + resourceType)}`);

  return alternatives.slice(0, 3); // Return top 3 alternatives
}

/**
 * Detects resource type from link text
 * @param {string} linkText - The text of the resource link
 * @returns {string} - Detected resource type
 */
function detectResourceType(linkText) {
  const text = linkText.toLowerCase();
  
  if (text.includes('article')) return 'article';
  if (text.includes('blog')) return 'blog';
  if (text.includes('docs') || text.includes('documentation')) return 'docs';
  if (text.includes('tutorial')) return 'tutorial';
  if (text.includes('course')) return 'course';
  if (text.includes('guide')) return 'guide';
  if (text.includes('reference')) return 'docs';
  
  // Default to article for general content
  return 'article';
}

/**
 * Finds alternative resource for any unavailable link
 * @param {string} originalUrl - The original unavailable URL
 * @param {string} linkText - The descriptive text from the markdown link
 * @returns {Promise<{found: boolean, alternativeUrl: string|null, topic: string, resourceType: string}>}
 */
async function findGeneralAlternative(originalUrl, linkText) {
  try {
    // Extract topic from link text
    const topic = extractTopicFromLinkText(linkText);
    
    if (!topic) {
      console.log('Could not extract topic from link text');
      return { found: false, alternativeUrl: null, topic: '', resourceType: '' };
    }

    // Detect resource type
    const resourceType = detectResourceType(linkText);
    
    console.log(`Searching for alternative ${resourceType} for topic: "${topic}"`);

    // Generate alternatives
    const alternatives = generateAlternativeResources(topic, resourceType);
    
    if (alternatives.length > 0) {
      const alternativeUrl = alternatives[0];
      console.log(`Generated ${resourceType} alternative: ${alternativeUrl}`);
      
      return { 
        found: true, 
        alternativeUrl, 
        topic,
        resourceType
      };
    }

    return { found: false, alternativeUrl: null, topic: '', resourceType: '' };

  } catch (error) {
    console.error('Error finding general alternative:', error);
    return { found: false, alternativeUrl: null, topic: '', resourceType: '' };
  }
}

/**
 * Searches for videos from trusted educational channels
 * @param {string} topic - The topic to search for
 * @returns {Promise<string[]>} - Array of potential video URLs
 */
async function searchTrustedChannels(topic) {
  // This is a simplified implementation that generates likely URLs
  // based on common patterns from trusted educational YouTube channels
  
  const potentialUrls = [];
  
  // Define trusted educational channels with their channel IDs or common URL patterns
  const trustedSources = [
    {
      name: 'freeCodeCamp',
      channelId: 'UC8butISFwT-Wl7EV0hUK0BQ',
      searchPattern: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' freeCodeCamp')}`
    },
    {
      name: 'Traversy Media',
      channelId: 'UC29ju8bIPH5as8OGnQzwJyA',
      searchPattern: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' Traversy Media')}`
    },
    {
      name: 'Programming with Mosh',
      channelId: 'UCWv7vMbMWH4-V0ZXdmDpPBA',
      searchPattern: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' Programming with Mosh')}`
    },
    {
      name: 'Net Ninja',
      channelId: 'UCW5YeuERMmlnqo4oq8vwUpg',
      searchPattern: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' Net Ninja')}`
    },
    {
      name: 'Fireship',
      channelId: 'UCsBjURrPoezykLs9EqgamOA',
      searchPattern: `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + ' Fireship')}`
    }
  ];

  // In a production environment with YouTube Data API:
  // 1. Use API key to search each channel
  // 2. Get video IDs from search results
  // 3. Validate each video
  // 4. Return first working video
  
  // For now, return search URLs that users can click to find alternatives
  // This maintains functionality without requiring API keys
  potentialUrls.push(...trustedSources.map(source => source.searchPattern));

  return potentialUrls.slice(0, 3); // Return top 3 search URLs
}

/**
 * Validates and filters resource links with automatic YouTube replacement
 * @param {string} markdownText - Markdown text containing resource links
 * @param {boolean} replaceUnavailable - Whether to replace unavailable YouTube videos (default: true)
 * @returns {Promise<{validatedText: string, originalCount: number, validCount: number, replacedCount: number}>}
 */
async function validateAndFilterLinksWithReplacement(markdownText, replaceUnavailable = true) {
  if (!markdownText || typeof markdownText !== 'string') {
    return { 
      validatedText: markdownText || '', 
      originalCount: 0, 
      validCount: 0,
      replacedCount: 0
    };
  }

  // Extract all URLs from markdown along with their link text
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const linksWithText = [];
  let match;
  
  while ((match = markdownLinkRegex.exec(markdownText)) !== null) {
    linksWithText.push({
      fullMatch: match[0],
      text: match[1],
      url: match[2].trim(),
    });
  }

  const originalCount = linksWithText.length;

  if (linksWithText.length === 0) {
    return { 
      validatedText: markdownText, 
      originalCount: 0, 
      validCount: 0,
      replacedCount: 0
    };
  }

  // Validate each URL and attempt replacement for unavailable resources
  let validatedText = markdownText;
  let validCount = 0;
  let replacedCount = 0;

  for (const link of linksWithText) {
    const { fullMatch, text, url } = link;
    const isYouTube = isYouTubeUrl(url);
    
    // Validate the URL
    const validationResult = await validateUrl(url);

    if (validationResult.isValid) {
      // URL is valid, keep it (update with final URL if redirected)
      if (validationResult.finalUrl !== url) {
        validatedText = validatedText.replace(url, validationResult.finalUrl);
      }
      validCount++;
    } else if (replaceUnavailable) {
      // Resource is unavailable, try to find replacement
      console.log(`Resource unavailable: ${url}`);
      
      let alternative;
      if (isYouTube) {
        // Use YouTube-specific replacement
        alternative = await findYouTubeAlternative(url, text);
      } else {
        // Use general resource replacement for articles, blogs, docs, etc.
        alternative = await findGeneralAlternative(url, text);
      }
      
      if (alternative.found && alternative.alternativeUrl) {
        // Replace with working alternative
        if (alternative.isSearchUrl || !isYouTube) {
          // For search URLs or general resources, add indicator
          const indicator = isYouTube ? ' (Search)' : ' (Alternative)';
          console.log(`Replacing with alternative: ${alternative.alternativeUrl}`);
          const newLinkText = text.includes('(Search)') || text.includes('(Alternative)') 
            ? text 
            : `${text}${indicator}`;
          const newLink = `[${newLinkText}](${alternative.alternativeUrl})`;
          const escapedFullMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          validatedText = validatedText.replace(new RegExp(escapedFullMatch, 'g'), newLink);
        } else {
          // Direct replacement (for direct YouTube videos)
          console.log(`Replacing with alternative: ${alternative.alternativeUrl}`);
          validatedText = validatedText.replace(url, alternative.alternativeUrl);
        }
        validCount++;
        replacedCount++;
      } else {
        // No alternative found, keep the bullet but mark as unavailable
        console.log(`No alternative found for: ${text}`);
        // Instead of removing, replace with a search link as last resort
        const topic = extractTopicFromLinkText(text);
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(topic)}`;
        const newLinkText = `${text} (Search)`;
        const newLink = `[${newLinkText}](${searchUrl})`;
        const escapedFullMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        validatedText = validatedText.replace(new RegExp(escapedFullMatch, 'g'), newLink);
        validCount++;
        replacedCount++;
      }
    } else {
      // Replacement disabled, remove invalid links
      const escapedFullMatch = fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      validatedText = validatedText.replace(new RegExp(escapedFullMatch, 'g'), '');
    }
  }

  // Clean up empty bullet points and extra newlines
  validatedText = validatedText.replace(/^- \s*$/gm, '');
  validatedText = validatedText.replace(/\n{3,}/g, '\n\n');

  return { 
    validatedText, 
    originalCount, 
    validCount,
    replacedCount
  };
}

/**
 * Extracts URLs from markdown text
 * @param {string} markdownText - Markdown text containing URLs
 * @returns {string[]} - Array of extracted URLs
 */
function extractUrlsFromMarkdown(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') {
    return [];
  }

  const urls = [];
  
  // Match markdown link format: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownLinkRegex.exec(markdownText)) !== null) {
    const url = match[2].trim();
    if (url) {
      urls.push(url);
    }
  }
  
  // Also match plain URLs (http:// or https://)
  const plainUrlRegex = /https?:\/\/[^\s<>")]+/g;
  const plainMatches = markdownText.match(plainUrlRegex) || [];
  urls.push(...plainMatches);
  
  return [...new Set(urls)]; // Remove duplicates
}

/**
 * Replaces URLs in markdown text with validated URLs
 * @param {string} markdownText - Original markdown text
 * @param {Map<string, string>} urlMap - Map of original URL to validated URL
 * @returns {string} - Updated markdown text
 */
function replaceUrlsInMarkdown(markdownText, urlMap) {
  if (!markdownText || !urlMap || urlMap.size === 0) {
    return markdownText;
  }

  let updatedText = markdownText;
  
  // Replace each URL with its validated version (or remove if invalid)
  urlMap.forEach((newUrl, oldUrl) => {
    // Escape special regex characters in URL
    const escapedOldUrl = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedOldUrl, 'g');
    updatedText = updatedText.replace(regex, newUrl);
  });
  
  return updatedText;
}

/**
 * Validates and filters resource links in markdown content
 * @param {string} markdownText - Markdown text containing resource links
 * @returns {Promise<{validatedText: string, originalCount: number, validCount: number}>}
 */
async function validateAndFilterLinks(markdownText) {
  if (!markdownText || typeof markdownText !== 'string') {
    return { 
      validatedText: markdownText || '', 
      originalCount: 0, 
      validCount: 0 
    };
  }

  // Extract all URLs from markdown
  const urls = extractUrlsFromMarkdown(markdownText);
  const originalCount = urls.length;

  if (urls.length === 0) {
    return { validatedText: markdownText, originalCount: 0, validCount: 0 };
  }

  // Validate URLs
  const validationResults = await Promise.all(
    urls.map(async (url) => {
      const result = await validateUrl(url);
      return { originalUrl: url, result };
    })
  );

  // Create URL mapping (original -> final or null if invalid)
  const urlMap = new Map();
  const validUrls = [];
  
  validationResults.forEach(({ originalUrl, result }) => {
    if (result.isValid && result.finalUrl) {
      urlMap.set(originalUrl, result.finalUrl);
      validUrls.push(result.finalUrl);
    }
  });

  // Remove invalid links from markdown
  let validatedText = markdownText;
  
  // For each invalid URL, remove the entire markdown link
  validationResults.forEach(({ originalUrl, result }) => {
    if (!result.isValid) {
      // Remove markdown link containing this URL
      const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const linkRegex = new RegExp(`\\[([^\\]]+)\\]\\(${escapedUrl}\\)`, 'g');
      validatedText = validatedText.replace(linkRegex, '');
      
      // Also remove from bullet list if it becomes empty
      validatedText = validatedText.replace(/^- \s*$/gm, '');
    }
  });

  // Replace valid URLs with their final destinations (after redirects)
  validatedText = replaceUrlsInMarkdown(validatedText, urlMap);

  // Clean up multiple consecutive newlines
  validatedText = validatedText.replace(/\n{3,}/g, '\n\n');

  return { 
    validatedText, 
    originalCount, 
    validCount: validUrls.length 
  };
}

module.exports = {
  validateUrl,
  validateUrls,
  extractUrlsFromMarkdown,
  replaceUrlsInMarkdown,
  validateAndFilterLinks,
  validateAndFilterLinksWithReplacement,
  findYouTubeAlternative,
  findGeneralAlternative,
  generateAlternativeResources,
  detectResourceType,
  isYouTubeUrl,
  validateYouTubeVideo,
};
