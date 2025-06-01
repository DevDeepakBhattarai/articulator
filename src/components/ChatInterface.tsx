"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message } from "ai";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  hasAnalyzedVideo: boolean;
  onSendMessage: (message: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  hasAnalyzedVideo,
  onSendMessage,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // Check if user is at bottom of messages
  const checkIfAtBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const threshold = 100; // 100px threshold from bottom
      const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsAtBottom(atBottom);
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    checkIfAtBottom();
  };

  // Auto-scroll to bottom only when user is at bottom and new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isAtBottom]);

  // Scroll to bottom when component first loads or video is analyzed
  useEffect(() => {
    if (hasAnalyzedVideo && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      setIsAtBottom(true);
    }
  }, [hasAnalyzedVideo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && hasAnalyzedVideo && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue("");
      // Scroll to bottom when user sends a message
      setIsAtBottom(true);
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div
      className="bg-white/10 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/20 shadow-2xl overflow-hidden flex flex-col"
      style={{ height: "calc(100vh - 160px)", minHeight: "600px" }}
    >
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-white/10">
        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg sm:rounded-xl">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
          Speech Coach Chat
        </h2>
      </div>

      {/* Messages Container */}
      <div
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && hasAnalyzedVideo && (
          <div className="text-center text-gray-300 py-8">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm sm:text-base">
              Video analysis complete! Ask me any questions about your speech or
              request more specific guidance.
            </p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-3 sm:p-4 ${
                message.role === "user"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100"
              }`}
            >
              {message.role === "user" ? (
                <p className="text-sm sm:text-base">{message.content}</p>
              ) : (
                <div className="prose prose-sm sm:prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <p className="text-gray-100 leading-relaxed text-sm sm:text-base mb-3 last:mb-0">
                          {children}
                        </p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-gray-100 text-lg sm:text-xl font-bold mb-3">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-gray-100 text-base sm:text-lg font-semibold mb-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-gray-100 text-sm sm:text-base font-medium mb-2">
                          {children}
                        </h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="text-gray-100 list-disc list-inside mb-3 space-y-1">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="text-gray-100 list-decimal list-inside mb-3 space-y-1">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-100 text-sm sm:text-base">
                          {children}
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="text-white font-semibold">
                          {children}
                        </strong>
                      ),
                      em: ({ children }) => (
                        <em className="text-gray-200 italic">{children}</em>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin text-gray-300" />
              <span className="text-gray-300 text-sm">Coach is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-white/10 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasAnalyzedVideo
                ? "Ask about your speech analysis or request more guidance..."
                : "Upload and analyze a video first to start chatting"
            }
            disabled={!hasAnalyzedVideo || isLoading}
            className="flex-1 bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-white placeholder-gray-400 resize-none min-h-[44px] max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            rows={1}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || !hasAnalyzedVideo || isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-3 sm:px-4 py-2 sm:py-3 transition-all duration-200 flex items-center justify-center min-w-[44px]"
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-2 text-center">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};
