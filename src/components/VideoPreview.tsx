import { Camera, Loader2, Mic, Video } from "lucide-react";

type RecordingState =
  | "idle"
  | "recording"
  | "stopped"
  | "uploading"
  | "processing";

interface VideoPreviewProps {
  recordingState: RecordingState;
  hasPermissions: boolean;
  recordingTime: number;
  videoUrl: string;
  previewVideoRef: React.RefObject<HTMLVideoElement | null>;
  playbackVideoRef: React.RefObject<HTMLVideoElement | null>;
  onRequestPermissions: () => void;
  formatTime: (seconds: number) => string;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  recordingState,
  hasPermissions,
  recordingTime,
  videoUrl,
  previewVideoRef,
  playbackVideoRef,
  onRequestPermissions,
  formatTime,
}) => {
  return (
    <div className="relative">
      <div className="aspect-video bg-black/50 flex items-center justify-center relative overflow-hidden">
        {!hasPermissions ? (
          <div className="text-center p-4 sm:p-6">
            <Video className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Camera Access Required
            </h3>
            <p className="text-sm sm:text-base text-blue-200 mb-3 px-2">
              Please allow camera and microphone access to continue
            </p>
            <button
              onClick={onRequestPermissions}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 text-sm sm:text-base"
            >
              Grant Access
            </button>
          </div>
        ) : recordingState === "idle" || recordingState === "recording" ? (
          <>
            <video
              ref={previewVideoRef}
              autoPlay
              muted
              playsInline
              controls={false}
              preload="auto"
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
              onError={(e) => console.error("Video element error:", e)}
              onPlay={() => {}}
              onPause={() => {}}
            />
            {recordingState === "idle" && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-center px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                    <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  <p className="text-white text-base sm:text-lg font-semibold">
                    Ready to record
                  </p>
                </div>
              </div>
            )}
          </>
        ) : recordingState === "stopped" ||
          recordingState === "uploading" ||
          recordingState === "processing" ? (
          <video
            ref={playbackVideoRef}
            controls
            className="w-full h-full object-cover"
            src={videoUrl}
            preload="auto"
            onLoadStart={() => {}}
            onCanPlay={() => {}}
            onError={(e) => console.error("Playback video error:", e)}
          />
        ) : (
          <div className="text-center px-4">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 animate-spin text-gray-400" />
            <p className="text-white text-base sm:text-lg">Loading...</p>
          </div>
        )}
      </div>

      {/* Recording Indicator */}
      {recordingState === "recording" && (
        <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex items-center space-x-1 sm:space-x-2">
          <div className="flex items-center bg-red-500/90 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse mr-1 sm:mr-2" />
            <span className="text-white font-bold text-xs sm:text-sm">REC</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
            <span className="text-white font-mono font-bold text-xs sm:text-sm">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      {/* Audio/Video Indicators */}
      {(recordingState === "recording" || recordingState === "idle") &&
        hasPermissions && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex space-x-1 sm:space-x-2">
            <div className="bg-green-500/90 backdrop-blur-sm p-1 sm:p-1.5 rounded-full">
              <Video className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
            <div className="bg-green-500/90 backdrop-blur-sm p-1 sm:p-1.5 rounded-full">
              <Mic className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
            </div>
          </div>
        )}
    </div>
  );
};
