import { useState, useRef, useCallback, useEffect } from "react";
import { useCompletion } from "@ai-sdk/react";

type RecordingState = "idle" | "recording" | "stopped" | "analyzing";

export const useVideoRecorder = () => {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [hasPermissions, setHasPermissions] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { complete, completion } = useCompletion({
    api: "/api/analyze-video",
  });

  const initializeCamera = useCallback(async () => {
    try {
      console.log("Initializing camera...");

      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints = {
        video: {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 2,
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("Stream obtained:", {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        videoSettings: stream.getVideoTracks()[0]?.getSettings(),
        audioSettings: stream.getAudioTracks()[0]?.getSettings(),
      });

      streamRef.current = stream;

      // Set up video preview
      if (previewVideoRef.current) {
        const videoElement = previewVideoRef.current;

        // Clear any existing srcObject first
        videoElement.srcObject = null;

        // Set up video properties before assigning stream
        videoElement.muted = true; // Essential for autoplay
        videoElement.playsInline = true; // Important for mobile
        videoElement.autoplay = true; // Explicit autoplay

        // Assign the stream
        videoElement.srcObject = stream;

        // Handle different events to ensure video starts playing
        const playVideo = async () => {
          try {
            console.log("Attempting to play video preview...");
            await videoElement.play();
            console.log("Video preview started successfully");
          } catch (error) {
            console.error("Video play failed:", error);
            // Retry after a short delay
            setTimeout(async () => {
              try {
                await videoElement.play();
                console.log("Video preview started on retry");
              } catch (retryError) {
                console.error("Video play retry failed:", retryError);
              }
            }, 100);
          }
        };

        // Try multiple events to ensure video starts
        videoElement.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          playVideo();
        };

        videoElement.oncanplay = () => {
          console.log("Video can play");
          playVideo();
        };

        videoElement.onloadeddata = () => {
          console.log("Video data loaded");
          playVideo();
        };

        // Also try to play immediately
        playVideo();
      }

      setHasPermissions(true);
      console.log("Camera initialized successfully");
    } catch (error) {
      console.error("Error accessing camera/microphone:", error);
      setHasPermissions(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      console.error("No stream available for recording");
      return;
    }

    try {
      const stream = streamRef.current;

      // Verify we have both audio and video tracks
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();

      console.log(
        `Starting recording with ${videoTracks.length} video tracks and ${audioTracks.length} audio tracks`
      );

      if (audioTracks.length === 0) {
        console.warn("No audio tracks available!");
      }

      // Choose the best available codec
      let mimeType = "video/webm";
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
        mimeType = "video/webm;codecs=vp9,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
        mimeType = "video/webm;codecs=vp8,opus";
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264,opus")) {
        mimeType = "video/webm;codecs=h264,opus";
      }

      console.log("Using MIME type:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        bitsPerSecond: 2500000, // 2.5 Mbps for good quality
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log(
            `Data chunk received: ${event.data.size} bytes, total chunks: ${chunksRef.current.length}`
          );
        } else {
          console.warn("Received empty data chunk");
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, creating blob...");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log(`Created blob: ${blob.size} bytes, type: ${blob.type}`);

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          console.log("Created video URL:", url);

          setRecordedBlob(blob);
          setVideoUrl(url);
          setRecordingState("stopped");

          // Ensure playback video element is properly set up
          setTimeout(() => {
            if (playbackVideoRef.current) {
              playbackVideoRef.current.srcObject = null; // Clear any live stream
              playbackVideoRef.current.src = url;
              playbackVideoRef.current.load(); // Force reload
              console.log("Playback video element updated with recorded video");
            }
          }, 100);
        } else {
          console.error("Recording failed: blob is empty");
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

      console.log(
        "Recording started, MediaRecorder state:",
        mediaRecorder.state
      );
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      console.log(
        "Stopping recording..., MediaRecorder state:",
        mediaRecorderRef.current.state
      );

      try {
        if (mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          console.log("MediaRecorder.stop() called");
        } else {
          console.warn(
            "MediaRecorder is not in recording state:",
            mediaRecorderRef.current.state
          );
        }
      } catch (error) {
        console.error("Error stopping MediaRecorder:", error);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      console.warn(
        "Cannot stop recording - no active MediaRecorder or not in recording state"
      );
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

      console.log("Uploading video...", {
        size: recordedBlob.size,
        type: recordedBlob.type,
      });

      const uploadResponse = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Video uploaded:", uploadResult);

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
    console.log("Resetting recording...");

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
      console.log("Re-initializing video preview...");
      if (previewVideoRef.current) {
        const videoElement = previewVideoRef.current;
        videoElement.srcObject = streamRef.current;
        videoElement.play().catch((e) => console.log("Autoplay prevented:", e));
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
  };
};
