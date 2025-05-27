import { Camera, Square, Loader2, RotateCcw, Sparkles } from "lucide-react";

type RecordingState = "idle" | "recording" | "stopped" | "analyzing";

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
      case "analyzing":
        return { text: "Analyzing your speech...", color: "text-blue-600" };
      default:
        return { text: "", color: "text-slate-600" };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="p-8">
      {/* Status */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
          <div
            className={`w-3 h-3 rounded-full ${
              recordingState === "recording"
                ? "bg-red-500 animate-pulse"
                : recordingState === "stopped"
                ? "bg-emerald-500"
                : recordingState === "analyzing"
                ? "bg-blue-500 animate-pulse"
                : "bg-slate-400"
            }`}
          />
          <p
            className={`text-lg font-semibold ${
              statusInfo.color === "text-slate-600"
                ? "text-white"
                : statusInfo.color
            }`}
          >
            {statusInfo.text}
          </p>
        </div>
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
                w-24 h-24 rounded-full border-4 flex items-center justify-center
                transition-all duration-300 transform hover:scale-110 shadow-2xl
                ${
                  recordingState === "recording"
                    ? "bg-red-500 border-red-400 hover:bg-red-600 shadow-red-500/50"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 border-blue-400 hover:from-blue-600 hover:to-purple-700 shadow-blue-500/50"
                }
              `}
            >
              {recordingState === "recording" ? (
                <Square className="w-10 h-10 text-white" />
              ) : (
                <Camera className="w-10 h-10 text-white" />
              )}
            </button>
          </div>
        )}

      {/* Analysis Controls */}
      {recordingState === "stopped" && (
        <div className="flex justify-center gap-6">
          <button
            onClick={onResetRecording}
            className="group px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center gap-3 border border-white/20"
          >
            <RotateCcw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" />
            Record Again
          </button>
          <button
            onClick={onAnalyzeVideo}
            className="group px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white rounded-2xl font-semibold transition-all duration-200 flex items-center gap-3 shadow-lg shadow-emerald-500/25"
          >
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
            Analyze Speech
          </button>
        </div>
      )}

      {/* Loading State */}
      {recordingState === "analyzing" && (
        <div className="flex justify-center">
          <div className="flex items-center gap-4 bg-blue-500/20 backdrop-blur-sm px-8 py-4 rounded-2xl border border-blue-500/30">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
            <span className="font-semibold text-blue-100">
              Analyzing your speech patterns...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
