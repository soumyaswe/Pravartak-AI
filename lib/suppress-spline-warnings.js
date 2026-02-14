/**
 * Suppress non-critical Spline runtime warnings
 * These warnings don't affect functionality but clutter the console
 */
export function suppressSplineWarnings() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const errorStr = args.join(' ');
    
    // Filter out Spline timeline/property warnings
    if (
      errorStr.includes('Missing property') ||
      errorStr.includes('@splinetool/runtime') ||
      errorStr.includes('buildTimeline') ||
      errorStr.includes('tp.buildTimeline')
    ) {
      return; // Suppress
    }
    
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const warnStr = args.join(' ');
    
    // Filter out Spline warnings
    if (
      warnStr.includes('@splinetool/runtime') ||
      warnStr.includes('Missing property')
    ) {
      return; // Suppress
    }
    
    originalWarn.apply(console, args);
  };

  return () => {
    console.error = originalError;
    console.warn = originalWarn;
  };
}
