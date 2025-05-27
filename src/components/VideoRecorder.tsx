"use client";

import { Mic } from "lucide-react";
import { useVideoRecorder } from "../hooks/useVideoRecorder";
import { VideoPreview } from "./VideoPreview";
import { RecordingControls } from "./RecordingControls";
import { AnalysisResults } from "./AnalysisResults";

export default function VideoRecorder() {
  const {
    recordingState,
    hasPermissions,
    recordingTime,
    videoUrl,
    completion,
    previewVideoRef,
    playbackVideoRef,
    initializeCamera,
    startRecording,
    stopRecording,
    analyzeVideo,
    resetRecording,
    formatTime,
    handleDeviceChange,
  } = useVideoRecorder();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
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
            Master your speaking skills with AI-powered feedback
          </p>
        </div>

        {/* Main Content Card */}
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

        {/* Analysis Results */}
        <AnalysisResults completion={completion} />
      </div>
    </div>
  );
}
