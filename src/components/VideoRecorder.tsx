"use client";

import { Mic } from "lucide-react";
import { useVideoRecorder } from "../hooks/useVideoRecorder";
import { VideoPreview } from "./VideoPreview";
import { RecordingControls } from "./RecordingControls";
import { ChatInterface } from "./ChatInterface";
import { ChatSessionsList } from "./ChatSessionsList";
import { getChatHistory } from "@/app/_actions/actions";
import { useState, useTransition } from "react";

export default function VideoRecorder() {
  const {
    recordingState,
    hasPermissions,
    recordingTime,
    videoUrl,
    hasAnalyzedVideo,
    messages,
    isLoading,
    currentChatSessionId,
    previewVideoRef,
    playbackVideoRef,
    initializeCamera,
    startRecording,
    stopRecording,
    analyzeVideo,
    resetRecording,
    formatTime,
    handleDeviceChange,
    append,
    setMessages,
  } = useVideoRecorder();

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleSelectSession = async (sessionId: string) => {
    startTransition(async () => {
      const result = await getChatHistory(sessionId);

      if (result.success) {
        setSelectedSessionId(sessionId);
        setMessages(result.messages || []);
        // You could also set video information here if needed
      } else {
        console.error("Failed to load chat history:", result.error);
      }
    });
  };

  const displaySessionId = currentChatSessionId || selectedSessionId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl">
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Speech Articulator
            </h1>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-blue-200 font-medium px-4">
            Master your speaking skills with AI-powered feedback and chat
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Chat Sessions Sidebar - Only show if we have sessions or current analysis */}
          {(hasAnalyzedVideo || displaySessionId) && (
            <div className="lg:col-span-3">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                <ChatSessionsList
                  onSelectSession={handleSelectSession}
                  currentSessionId={displaySessionId}
                />
              </div>
            </div>
          )}

          {/* Chat Interface - Show when we have a session */}
          {(hasAnalyzedVideo || displaySessionId) && (
            <div
              className={`${
                hasAnalyzedVideo || displaySessionId
                  ? "lg:col-span-5"
                  : "lg:col-span-8"
              }`}
            >
              <ChatInterface
                messages={messages}
                isLoading={isLoading || isPending}
                hasAnalyzedVideo={hasAnalyzedVideo || !!displaySessionId}
                onSendMessage={(message) =>
                  append({ role: "user", content: message })
                }
              />
            </div>
          )}

          {/* Video and Controls */}
          <div
            className={`${
              hasAnalyzedVideo || displaySessionId
                ? "lg:col-span-4"
                : "lg:col-span-12 max-w-4xl mx-auto"
            }`}
          >
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Video Section */}
              <div className="aspect-video">
                <VideoPreview
                  recordingState={recordingState}
                  hasPermissions={hasPermissions}
                  recordingTime={recordingTime}
                  videoUrl={videoUrl}
                  previewVideoRef={previewVideoRef}
                  playbackVideoRef={playbackVideoRef}
                  onRequestPermissions={initializeCamera}
                  formatTime={formatTime}
                />
              </div>

              {/* Controls Section */}
              <RecordingControls
                recordingState={recordingState}
                hasPermissions={hasPermissions}
                recordingTime={recordingTime}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onAnalyzeVideo={analyzeVideo}
                onResetRecording={resetRecording}
                formatTime={formatTime}
                onDeviceChange={handleDeviceChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
