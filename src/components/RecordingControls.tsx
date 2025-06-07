import { Camera, Square, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { DeviceSelector } from "./DeviceSelector";

type RecordingState =
  | "idle"
  | "recording"
  | "stopped"
  | "uploading"
  | "processing";

interface RecordingControlsProps {
  recordingState: RecordingState;
  hasPermissions: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnalyzeVideo: () => void;
  onResetRecording: () => void;
  formatTime: (seconds: number) => string;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  recordingState,
  hasPermissions,
  recordingTime,
  onStartRecording,
  onStopRecording,
  onAnalyzeVideo,
  onResetRecording,
  formatTime,
}) => {
  const getStatusInfo = () => {
    switch (recordingState) {
      case "idle":
        return { text: "Ready to record", color: "text-slate-600" };
      case "recording":
        return {
          text: `Recording... ${formatTime(recordingTime)}`,
          color: "text-red-500",
        };
      case "stopped":
        return { text: "Recording complete", color: "text-emerald-600" };
      case "uploading":
        return { text: "Uploading video...", color: "text-orange-600" };
      case "processing":
        return { text: "Analyzing your speech...", color: "text-blue-600" };
      default:
        return { text: "", color: "text-slate-600" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      {/* Status */}
      <div className="text-center mb-4 sm:mb-6">
        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
          <div
            className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
              recordingState === "recording"
                ? "bg-red-500 animate-pulse"
                : recordingState === "stopped"
                ? "bg-emerald-500"
                : recordingState === "uploading"
                ? "bg-orange-500 animate-pulse"
                : recordingState === "processing"
                ? "bg-blue-500 animate-pulse"
                : "bg-slate-400"
            }`}
          />
          <p
            className={`text-sm sm:text-base font-semibold ${
              statusInfo.color === "text-slate-600"
                ? "text-white"
                : statusInfo.color
            }`}
          >
            {statusInfo.text}
          </p>
        </div>
      </div>

      {/* Device Selector - Always visible */}
      <div className="flex justify-center mb-4 sm:mb-6 px-2">
        <DeviceSelector
          disabled={recordingState === "recording"}
          compact={true}
        />
      </div>

      {/* Recording Controls */}
      {(recordingState === "idle" || recordingState === "recording") &&
        hasPermissions && (
          <div className="flex justify-center">
            <button
              onClick={
                recordingState === "idle" ? onStartRecording : onStopRecording
              }
              className={`
                w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full border-3 sm:border-4 flex items-center justify-center
                transition-all duration-300 transform hover:scale-110 shadow-2xl
                ${
                  recordingState === "recording"
                    ? "bg-red-500 border-red-400 hover:bg-red-600 shadow-red-500/50"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 hover:from-blue-600 hover:to-purple-700 shadow-blue-500/50"
                }
              `}
            >
              {recordingState === "recording" ? (
                <Square className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              ) : (
                <Camera className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
              )}
            </button>
          </div>
        )}

      {/* Analysis Controls */}
      {recordingState === "stopped" && (
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-2">
          <button
            onClick={onResetRecording}
            className="group px-4 sm:px-6 py-2.5 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-white/20 text-sm sm:text-base"
          >
            <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
            Record Again
          </button>
          <button
            onClick={onAnalyzeVideo}
            className="group px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white rounded-lg sm:rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 text-sm sm:text-base"
          >
            <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200" />
            Analyze Speech
          </button>
        </div>
      )}

      {/* Loading State */}
      {(recordingState === "uploading" || recordingState === "processing") && (
        <div className="flex flex-col items-center gap-3 px-2">
          <div
            className={`flex items-center gap-2 sm:gap-3 backdrop-blur-sm px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl border ${
              recordingState === "uploading"
                ? "bg-orange-500/20 border-orange-500/30"
                : "bg-blue-500/20 border-blue-500/30"
            }`}
          >
            <Loader2
              className={`w-4 h-4 sm:w-5 sm:h-5 animate-spin ${
                recordingState === "uploading"
                  ? "text-orange-400"
                  : "text-blue-400"
              }`}
            />
            <span
              className={`font-semibold text-sm sm:text-base ${
                recordingState === "uploading"
                  ? "text-orange-100"
                  : "text-blue-100"
              }`}
            >
              {recordingState === "uploading"
                ? "Uploading video..."
                : "Analyzing your speech patterns..."}
            </span>
          </div>

          {/* Cancel/Reset option during upload/processing */}
          <button
            onClick={onResetRecording}
            className="group px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 border border-white/20 text-xs sm:text-sm"
          >
            <RotateCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300" />
            Cancel & Record Again
          </button>
        </div>
      )}
    </div>
  );
};
