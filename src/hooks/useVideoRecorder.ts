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
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.muted = true; // Important for autoplay

        // Handle video load and play
        previewVideoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          previewVideoRef.current
            ?.play()
            .then(() => console.log("Video preview started"))
            .catch((error) => console.error("Video play failed:", error));
        };
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
          console.log(`Data chunk: ${event.data.size} bytes`);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, creating blob...");
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log(`Created blob: ${blob.size} bytes, type: ${blob.type}`);

        setRecordedBlob(blob);
        setVideoUrl(URL.createObjectURL(blob));
        setRecordingState("stopped");

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
      };

      mediaRecorder.start(1000); // Collect data every 1 second
      setRecordingState("recording");
      setRecordingTime(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      console.log("Recording started");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      console.log("Stopping recording...");
      mediaRecorderRef.current.stop();

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
    setRecordingState("idle");
    setRecordedBlob(null);
    setVideoUrl("");
    setRecordingTime(0);

    if (playbackVideoRef.current) {
      playbackVideoRef.current.src = "";
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
      setTimeout(() => {
        initializeCamera();
      }, 100);
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
