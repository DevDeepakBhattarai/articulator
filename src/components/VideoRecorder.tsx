"use client";

import { useEffect } from "react";
import { useVideoRecorder } from "../hooks/useVideoRecorder";
import { VideoPreview } from "./VideoPreview";
import { RecordingControls } from "./RecordingControls";
import { ChatInterface } from "./ChatInterface";
import { useTransition } from "react";
import type { VideoLoadEvent } from "./ChatHistorySheet";
import { useArticulatorStore } from "@/states/useArticulatorStore";
import { cn } from "@/lib/utils";

export default function VideoRecorder() {
  const {
    recordingState,
    hasPermissions,
    recordingTime,
    previewVideoRef,
    playbackVideoRef,
    initializeCamera,
    startRecording,
    stopRecording,
    analyzeVideo,
    resetRecording,
    formatTime,
    loadVideoFromPath,
    showChat,
  } = useVideoRecorder();

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
    <div className="bg-background flex-shrink">
      <div
        className={cn(
          "bg-muted/80 backdrop-blur-xl rounded-2xl border border-primary/20 shadow-2xl overflow-hidden",
          !showChat && "max-w-7xl",
          showChat && "max-w-3xl"
        )}
      >
        <div className="aspect-video">
          <VideoPreview
            recordingState={recordingState}
            hasPermissions={hasPermissions}
            recordingTime={recordingTime}
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
        />
      </div>
    </div>
  );
}
