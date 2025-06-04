"use client";

import { Mic } from "lucide-react";
import { useVideoRecorder } from "../hooks/useVideoRecorder";
import { VideoPreview } from "./VideoPreview";
import { RecordingControls } from "./RecordingControls";
import { ChatInterface } from "./ChatInterface";
import { ChatHistorySheet } from "./ChatHistorySheet";
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
    showChat,
    previewVideoRef,
    playbackVideoRef,
    streamRef,
    initializeCamera,
    startRecording,
    stopRecording,
    analyzeVideo,
    resetRecording,
    formatTime,
    handleDeviceChange,
    append,
    setMessages,
    setVideoUrl,
    setHasAnalyzedVideo,
    setRecordingState,
    setShowChat,
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

        // Load the associated video if available
        if (result.chatSession?.video) {
          const video = result.chatSession.video;

          // Set video URL to serve from our API endpoint
          if (video.filePath) {
            // Encode the full path for the API call
            // Convert Windows path separators and encode each segment
            const pathSegments = video.filePath.replace(/\\/g, "/").split("/");
            const encodedSegments = pathSegments.map((segment) =>
              encodeURIComponent(segment)
            );
            const videoApiUrl = `/api/video/${encodedSegments.join("/")}`;

            console.log("Loading video from path:", video.filePath);
            console.log("API URL:", videoApiUrl);

            // Stop the live camera stream first
            if (streamRef.current) {
              streamRef.current
                .getTracks()
                .forEach((track: MediaStreamTrack) => track.stop());
              streamRef.current = null;
            }

            // Clear the preview video element
            if (previewVideoRef.current) {
              previewVideoRef.current.srcObject = null;
              previewVideoRef.current.src = "";
            }

            // Set up for playback mode
            setVideoUrl(videoApiUrl);
            setHasAnalyzedVideo(true);
            setRecordingState("stopped");

            // Set up the playback video element
            setTimeout(() => {
              if (playbackVideoRef.current) {
                playbackVideoRef.current.src = videoApiUrl;
                playbackVideoRef.current.load();
              }
            }, 100);
          }
        }
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
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            {/* Left side - empty for balance */}
            <div className="w-32"></div>

            {/* Center - Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg sm:rounded-xl">
                <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Speech Articulator
              </h1>
            </div>

            {/* Right side - Chat History Button */}
            <div className="w-32 flex justify-end">
              <ChatHistorySheet
                onSelectSession={handleSelectSession}
                currentSessionId={displaySessionId}
              />
            </div>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-blue-200 font-medium px-4">
            Master your speaking skills with AI-powered feedback and chat
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Chat Interface - Show when we have a session and showChat is true */}
          {showChat && (hasAnalyzedVideo || displaySessionId) && (
            <div className="lg:order-1">
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
                ? "lg:order-2"
                : "lg:col-span-2 max-w-4xl mx-auto"
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
