"use client";

import { useEffect } from "react";
import { Mic } from "lucide-react";
import { useVideoRecorder } from "../hooks/useVideoRecorder";
import { VideoPreview } from "./VideoPreview";
import { RecordingControls } from "./RecordingControls";
import { ChatInterface } from "./ChatInterface";
import { useTransition } from "react";
import type { VideoLoadEvent } from "./ChatHistorySheet";

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
    loadVideoFromPath,
  } = useVideoRecorder();

  const [isPending, startTransition] = useTransition();

  // Listen for video load events
  useEffect(() => {
    const handleVideoLoad = (event: VideoLoadEvent) => {
      const { videoPath } = event.detail;
      loadVideoFromPath(videoPath);
    };

    // Add event listener
    window.addEventListener("articulator:load-video", handleVideoLoad);

    // Clean up
    return () => {
      window.removeEventListener("articulator:load-video", handleVideoLoad);
    };
  }, [loadVideoFromPath]);

  return (
    <div className="h-full w-full bg-background">
      {/* Main Content */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Chat Interface - Show when we have a session and showChat is true */}
        {showChat && (hasAnalyzedVideo || currentChatSessionId) && (
          <div className="lg:order-1">
            <ChatInterface
              messages={messages}
              isLoading={isLoading || isPending}
              hasAnalyzedVideo={hasAnalyzedVideo || !!currentChatSessionId}
              onSendMessage={(message) =>
                append({ role: "user", content: message })
              }
            />
          </div>
        )}

        {/* Video and Controls */}
        <div
          className={`${
            hasAnalyzedVideo || currentChatSessionId
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
  );
}
