import { useState, useRef, useCallback, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";

type RecordingState = "idle" | "recording" | "stopped" | "analyzing";

export const useVideoRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [hasPermissions, setHasPermissions] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<
    string | null
  >(null);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<
    string | null
  >(null);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { complete, completion } = useCompletion({
    api: "/api/analyze-video",
  });

  const initializeCamera = useCallback(
    async (forceDeviceIds?: {
      videoId?: string | null;
      audioId?: string | null;
    }) => {
      const videoDeviceId = forceDeviceIds?.videoId ?? selectedVideoDeviceId;
      const audioDeviceId = forceDeviceIds?.audioId ?? selectedAudioDeviceId;
      try {
        // Stop any existing stream first
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const constraints = {
          video: videoDeviceId
            ? {
                deviceId: { exact: videoDeviceId },
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 30 },
              }
            : {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: "user",
                frameRate: { ideal: 30 },
              },
          audio: audioDeviceId
            ? {
                deviceId: { exact: audioDeviceId },
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 2,
              }
            : {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 44100,
                channelCount: 2,
              },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        streamRef.current = stream;

        // Set up video preview
        if (previewVideoRef.current) {
          const videoElement = previewVideoRef.current;

          // Clear any existing event listeners to prevent multiple handlers
          videoElement.onloadedmetadata = null;
          videoElement.oncanplay = null;
          videoElement.onloadeddata = null;

          // Pause and clear existing stream to prevent interruption
          try {
            videoElement.pause();
          } catch {
            // Ignore pause errors
          }
          videoElement.srcObject = null;

          // Set up video properties before assigning stream
          videoElement.muted = true; // Essential for autoplay
          videoElement.playsInline = true; // Important for mobile
          videoElement.autoplay = true; // Explicit autoplay

          // Single play handler to avoid race conditions
          const playVideo = async () => {
            try {
              await videoElement.play();
            } catch (error) {
              // Only retry if it's not an interruption error
              if (
                error instanceof Error &&
                !error.message.includes("interrupted")
              ) {
                setTimeout(async () => {
                  try {
                    await videoElement.play();
                  } catch {
                    // Retry failed, continue silently
                  }
                }, 100);
              }
            }
          };

          // Set up single event listener for when video is ready
          videoElement.onloadedmetadata = () => {
            playVideo();
          };

          // Assign the stream after setting up the handler
          videoElement.srcObject = stream;
        }

        setHasPermissions(true);
      } catch (error) {
        console.error("Error accessing camera/microphone:", error);
        setHasPermissions(false);
      }
    },
    [selectedVideoDeviceId, selectedAudioDeviceId]
  );

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      return;
    }

    try {
      const stream = streamRef.current;

      // Verify we have both audio and video tracks available
      stream.getAudioTracks();
      stream.getVideoTracks();

      // Choose the best available codec
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
        mimeType = "video/webm;codecs=vp9,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
        mimeType = "video/webm;codecs=vp8,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")) {
        mimeType = "video/webm;codecs=h264,opus";
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        bitsPerSecond: 2500000, // 2.5 Mbps for good quality
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);

          setRecordedBlob(blob);
          setVideoUrl(url);
          setRecordingState("stopped");

          // Ensure playback video element is properly set up
          setTimeout(() => {
            if (playbackVideoRef.current) {
              playbackVideoRef.current.srcObject = null; // Clear any live stream
              playbackVideoRef.current.src = url;
              playbackVideoRef.current.load(); // Force reload
            }
          }, 100);
        } else {
          setRecordingState("idle");
        }

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
      };

      // Clear any previous recording data
      chunksRef.current = [];
      setRecordedBlob(null);
      setVideoUrl("");

      mediaRecorder.start(1000); // Collect data every 1 second
      setRecordingState("recording");
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      } catch (error) {
        console.error("Error stopping MediaRecorder:", error);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [recordingState]);

  const analyzeVideo = useCallback(async () => {
    if (!recordedBlob) return;

    setRecordingState("analyzing");

    try {
      // Step 1: Upload video file
      const formData = new FormData();
      const videoFile = new File([recordedBlob], "recording.webm", {
        type: recordedBlob.type,
      });
      formData.append("video", videoFile);

      const uploadResponse = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      const uploadResult = await uploadResponse.json();

      // Step 2: Analyze video using the file path
      await complete("", {
        body: {
          filePath: uploadResult.filePath,
          mimeType: uploadResult.mimeType,
        },
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
      setRecordingState("stopped");
    }
  }, [recordedBlob, complete]);

  const resetRecording = useCallback(() => {
    // Clear state
    setRecordingState("idle");
    setRecordedBlob(null);
    setVideoUrl("");
    setRecordingTime(0);

    // Clear chunks
    chunksRef.current = [];

    // Clear playback video
    if (playbackVideoRef.current) {
      playbackVideoRef.current.src = "";
      playbackVideoRef.current.srcObject = null;
      playbackVideoRef.current.load();
    }

    // Stop any ongoing recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.warn("Error stopping MediaRecorder during reset:", error);
      }
    }

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Restart camera preview
    initializeCamera();
  }, [initializeCamera]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleDeviceChange = useCallback(
    (videoDeviceId: string | null, audioDeviceId: string | null) => {
      setSelectedVideoDeviceId(videoDeviceId);
      setSelectedAudioDeviceId(audioDeviceId);

      // Force re-initialize camera with new devices immediately
      if (hasPermissions) {
        initializeCamera({ videoId: videoDeviceId, audioId: audioDeviceId });
      }
    },
    [hasPermissions, initializeCamera]
  );

  // Initialize camera on mount
  useEffect(() => {
    const initCamera = async () => {
      // Add a small delay to ensure DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if we already have permissions and a stream
      if (!hasPermissions || !streamRef.current) {
        await initializeCamera();
      }
    };

    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initializeCamera]);

  // Additional effect to re-initialize camera when component mounts with video ref
  useEffect(() => {
    if (
      previewVideoRef.current &&
      hasPermissions &&
      streamRef.current &&
      !previewVideoRef.current.srcObject
    ) {
      if (previewVideoRef.current) {
        const videoElement = previewVideoRef.current;
        videoElement.srcObject = streamRef.current;
        videoElement.play().catch(() => {
          // Autoplay prevented, continue silently
        });
      }
    }
  }, [previewVideoRef.current, hasPermissions]);

  return {
    // State
    recordingState,
    hasPermissions,
    recordingTime,
    videoUrl,
    completion,

    // Refs
    previewVideoRef,
    playbackVideoRef,

    // Actions
    initializeCamera,
    startRecording,
    stopRecording,
    analyzeVideo,
    resetRecording,
    formatTime,
    handleDeviceChange,
  };
};
