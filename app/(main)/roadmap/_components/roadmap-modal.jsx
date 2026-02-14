'use client';

import { useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * RoadmapModal - A modal component for displaying node content
 * 
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {Function} onClose - Callback to close the modal
 * @param {Object} node - The node data containing label and contentFile
 */
export default function RoadmapModal({ isOpen, onClose, node }) {
  // Close modal on ESC key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open or no node data
  if (!isOpen || !node) return null;

  // Parse and sanitize markdown content
  const getFormattedContent = () => {
    if (!node.contentFile) return '';
    
    try {
      // Configure custom renderer for links
      const renderer = new marked.Renderer();
      const originalLinkRenderer = renderer.link.bind(renderer);
      
      // Override link rendering to add target="_blank" and rel attributes
      renderer.link = (href, title, text) => {
        const html = originalLinkRenderer(href, title, text);
        return html.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ');
      };

      // Configure marked for better rendering
      marked.setOptions({
        breaks: true,
        gfm: true,
        headerIds: false,
        renderer: renderer,
      });

      // Convert markdown to HTML
      const rawHtml = marked.parse(node.contentFile);
      
      // Sanitize HTML to prevent XSS (allow target and rel attributes)
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'rel']
      });
      
      return cleanHtml;
    } catch (error) {
      console.error('Error parsing markdown:', error);
      return node.contentFile; // Fallback to raw text
    }
  };

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <h2 
                id="modal-title"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                {node.label}
              </h2>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors group"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white" />
            </button>
          </div>

          {/* Modal Body - Scrollable Content */}
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {node.contentFile ? (
              <div 
                className="markdown-content prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: getFormattedContent() }}
                style={{
                  // Custom markdown styling
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No content available for this node.
              </p>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Press <kbd className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-xs">ESC</kbd> to close
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200 hover:scale-105"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>

      {/* Custom Styles for Markdown Content */}
      <style jsx>{`
        .markdown-content {
          line-height: 1.7;
        }

        .markdown-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .markdown-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.875rem;
          color: #374151;
        }

        .markdown-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          color: #4b5563;
        }

        .markdown-content p {
          font-size: 1rem;
          margin-bottom: 1rem;
          color: #4b5563;
        }

        .markdown-content ul, .markdown-content ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          list-style-position: outside;
        }

        .markdown-content li {
          margin-bottom: 0.5rem;
          color: #4b5563;
          padding-left: 0.25rem;
        }

        .markdown-content li a {
          display: inline-block;
          margin-left: 0.25rem;
        }

        .markdown-content strong {
          font-weight: 600;
          color: #1f2937;
        }

        /* Special styling for Resources section */
        .markdown-content strong:has(+ ul) {
          color: #7c3aed;
        }

        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: #a855f7;
        }

        .markdown-content pre {
          background-color: #1f2937;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1rem;
        }

        .markdown-content pre code {
          background-color: transparent;
          color: #e5e7eb;
          padding: 0;
        }

        .markdown-content blockquote {
          border-left: 4px solid #a855f7;
          padding-left: 1rem;
          margin: 1rem 0;
          color: #6b7280;
          font-style: italic;
        }

        /* Resource link styles - Override prose defaults */
        .markdown-content a,
        .prose a,
        .prose-sm a,
        .prose-lg a {
          color: #2563eb !important;
          text-decoration: none !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
          border-bottom: 1px solid transparent !important;
          padding: 2px 4px !important;
          border-radius: 4px !important;
        }

        .markdown-content a:hover,
        .prose a:hover,
        .prose-sm a:hover,
        .prose-lg a:hover {
          color: #1d4ed8 !important;
          background-color: #dbeafe !important;
          border-bottom: 1px solid #1d4ed8 !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.15) !important;
        }

        /* Dark mode styles */
        @media (prefers-color-scheme: dark) {
          .markdown-content h1,
          .markdown-content h2,
          .markdown-content h3 {
            color: #f9fafb;
          }

          .markdown-content p,
          .markdown-content li {
            color: #d1d5db;
          }

          .markdown-content strong {
            color: #f9fafb;
          }

          .markdown-content code {
            background-color: #374151;
            color: #c084fc;
          }

          .markdown-content blockquote {
            color: #9ca3af;
          }

          /* Dark mode resource links - Override prose defaults */
          .markdown-content a,
          .dark .prose a,
          .dark .prose-sm a,
          .dark .prose-lg a {
            color: #60a5fa !important;
          }

          .markdown-content a:hover,
          .dark .prose a:hover,
          .dark .prose-sm a:hover,
          .dark .prose-lg a:hover {
            color: #93c5fd !important;
            background-color: #1e3a5f !important;
            border-bottom-color: #93c5fd !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 2px 4px rgba(96, 165, 250, 0.2) !important;
          }
        }

        /* Smooth scrollbar */
        .markdown-content::-webkit-scrollbar {
          width: 8px;
        }

        .markdown-content::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 4px;
        }

        .markdown-content::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }

        .markdown-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </>
  );
}
