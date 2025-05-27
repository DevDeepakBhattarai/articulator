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
  } = useVideoRecorder();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-black bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              Speech Articulator
            </h1>
          </div>
          <p className="text-xl text-blue-200 font-medium">
            Master your speaking skills with AI-powered feedback
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Video Section */}
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

        {/* Analysis Results */}
        <AnalysisResults completion={completion} />
      </div>
    </div>
  );
}
