"use client";

import React, { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  MessageCircle,
  X,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Helper function to format markdown-like text
const formatMessage = (text) => {
  if (!text) return text;
  
  // Convert **bold** to <strong>
  let formatted = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert `code` to <code>
  formatted = formatted.replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs">$1</code>');
  
  // Convert bullet points (- or *) to proper list items
  formatted = formatted.replace(/^[\-\*]\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  
  // Convert numbered lists
  formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  
  return formatted;
};

const ChatPopup = ({ isOpen, onClose }) => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      text: "Hi! How can I assist you with your career goals today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const chatRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setChatMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    }
  }, [isOpen]); // Re-run when chat opens to check for updates

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (chatMessages.length > 1) { // Only save if there are messages beyond the initial greeting
      localStorage.setItem('chatHistory', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // Close chat popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Auto scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Suggested prompts for first-time users
  const suggestedPrompts = [
    "What skills are in high demand for software engineers?",
    "How can I improve my resume for tech jobs?",
    "Suggest a learning plan to become competent in [skill] in 90 days with weekly goals and projects.",
    "Recommend career paths based on my strengths: ask 2 clarifying questions first.",
  ];

  // Handle suggested prompt click
  const handlePromptClick = async (prompt) => {
    setMessage(prompt);
    // Auto-send the message after a brief delay to show it in the input
    setTimeout(() => {
      const userMessage = {
        id: chatMessages.length + 1,
        text: prompt,
        sender: "user",
        timestamp: new Date(),
      };
      
      setChatMessages(prev => [...prev, userMessage]);
      setMessage("");
      setIsLoading(true);
      
      // Call API
      handleAPICall(prompt, chatMessages);
    }, 100);
  };

  // Extracted API call logic for reuse
  const handleAPICall = async (messageText, currentChatMessages) => {
    try {
      const messageHistory = currentChatMessages
        .filter(msg => msg.id !== 1)
        .map(msg => ({
          text: msg.text,
          sender: msg.sender
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          hasImage: false,
          messageHistory: messageHistory
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiResponse = {
          id: currentChatMessages.length + 2,
          text: data.response,
          sender: "assistant",
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, aiResponse]);
      } else {
        const errorResponse = {
          id: currentChatMessages.length + 2,
          text: data.error || "Sorry, I encountered an error. Please try again.",
          sender: "assistant",
          timestamp: new Date(),
        };
        setChatMessages(prev => [...prev, errorResponse]);
      }
    } catch (error) {
      console.error('Error calling chat API:', error);
      const errorResponse = {
        id: currentChatMessages.length + 2,
        text: "Sorry, I'm having trouble connecting. Please check your internet connection and try again.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat functionality with Gemini API
  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      const userMessage = {
        id: chatMessages.length + 1,
        text: message,
        sender: "user",
        timestamp: new Date(),
      };
      
      // Add user message immediately
      setChatMessages(prev => [...prev, userMessage]);
      const currentMessage = message;
      setMessage("");
      setIsLoading(true);
      
      // Use the extracted API call function
      await handleAPICall(currentMessage, chatMessages);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat history
  const handleClearHistory = () => {
    const initialMessage = {
      id: 1,
      text: "Hi! How can I assist you with your career goals today?",
      sender: "assistant",
      timestamp: new Date(),
    };
    setChatMessages([initialMessage]);
    localStorage.removeItem('chatHistory');
    setMessage(""); // Clear any text in input field
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={chatRef}
      className="fixed bottom-5 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-96 h-[70vh] sm:h-[500px] max-w-md bg-background border border-border rounded-lg shadow-2xl z-50 flex flex-col"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <h3 className="font-semibold text-sm sm:text-base">Career Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            className="h-7 w-7 sm:h-8 sm:w-8"
            title="Clear chat history"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 sm:h-8 sm:w-8"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[70%] rounded-lg p-2 sm:p-3 ${
                msg.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <div 
                className="text-xs sm:text-sm whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
              />
              <p className="text-[10px] sm:text-xs opacity-70 mt-1">
                {format(msg.timestamp, "HH:mm")}
              </p>
            </div>
          </div>
        ))}
        
        {/* Suggested Prompts - Show only for first-time users */}
        {chatMessages.length === 1 && !isLoading && (
          <div className="space-y-2 mt-4">
            <p className="text-xs text-muted-foreground text-center">Try asking:</p>
            <div className="grid grid-cols-1 gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left text-xs sm:text-sm p-2 sm:p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-2 sm:p-3 max-w-[85%] sm:max-w-[70%]">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>      {/* Chat Input */}
      <div className="p-3 sm:p-4 border-t border-border">
        <div className="flex space-x-2">
          <Input
            placeholder="Ask about careers, skills, salaries..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 text-sm"
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage} 
            size="icon" 
            className="h-9 w-9 sm:h-10 sm:w-10"
            disabled={isLoading || !message.trim()}
          >
            <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

// Chat Button and Container Component
const ChatAssistant = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-5 right-3 sm:right-6 z-40">
        <Button
          onClick={toggleChat}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          size="icon"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
        
        {/* Tooltip - Always shown when chat is closed */}
        {!isChatOpen && (
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-foreground text-background text-sm font-medium rounded-lg shadow-lg whitespace-nowrap animate-bounce-subtle">
            Chat with AI Assistant
            <div className="absolute top-full right-6 -mt-1 border-4 border-transparent border-t-foreground"></div>
          </div>
        )}
      </div>

      {/* Chat Popup */}
      <ChatPopup isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      
      {/* Custom Animation Styles */}
      <style jsx>{`
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
};

export default ChatAssistant;