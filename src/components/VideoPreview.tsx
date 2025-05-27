import { Camera, Loader2, Mic, Video } from "lucide-react";

type RecordingState = "idle" | "recording" | "stopped" | "analyzing";

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
          <div className="text-center p-8">
            <Video className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Camera Access Required
            </h3>
            <p className="text-blue-200 text-lg mb-4">
              Please allow camera and microphone access to continue
            </p>
            <button
              onClick={onRequestPermissions}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
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
              onPlay={() => console.log("Video element started playing")}
              onPause={() => console.log("Video element paused")}
            />
            {recordingState === "idle" && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-12 h-12 text-white" />
                  </div>
                  <p className="text-white text-xl font-semibold">
                    Ready to record
                  </p>
                </div>
              </div>
            )}
          </>
        ) : recordingState === "stopped" ? (
          <video
            ref={playbackVideoRef}
            controls
            className="w-full h-full object-cover"
            src={videoUrl}
            preload="auto"
            onLoadStart={() => console.log("Playback video loading started")}
            onCanPlay={() => console.log("Playback video can play")}
            onError={(e) => console.error("Playback video error:", e)}
          />
        ) : (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-white text-xl">Processing video...</p>
          </div>
        )}
      </div>

      {/* Recording Indicator */}
      {recordingState === "recording" && (
        <div className="absolute top-6 left-6 flex items-center space-x-3">
          <div className="flex items-center bg-red-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse mr-2" />
            <span className="text-white font-bold text-sm">REC</span>
          </div>
          <div className="bg-black/50 backdrop-blur-sm px-3 py-2 rounded-full">
            <span className="text-white font-mono font-bold">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      {/* Audio/Video Indicators */}
      {(recordingState === "recording" || recordingState === "idle") &&
        hasPermissions && (
          <div className="absolute top-6 right-6 flex space-x-2">
            <div className="bg-green-500/90 backdrop-blur-sm p-2 rounded-full">
              <Video className="w-4 h-4 text-white" />
            </div>
            <div className="bg-green-500/90 backdrop-blur-sm p-2 rounded-full">
              <Mic className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
    </div>
  );
};
