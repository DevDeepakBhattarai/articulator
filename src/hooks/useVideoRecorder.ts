import { useState, useRef, useCallback, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { useArticulatorStore } from "../states/useArticulatorStore";

type RecordingState =
  | "idle"
  | "recording"
  | "stopped"
  | "uploading"
  | "processing";

export const useVideoRecorder = () => {
  // Use the Zustand store only for global state
  const {
    setVideoUrl,
    hasAnalyzedVideo,
    setHasAnalyzedVideo,
    currentChatSessionId,
    setCurrentChatSessionId,
    showChat,
    setShowChat,
    messages,
    setMessages,
    isLoading,
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    resetGlobalState,
  } = useArticulatorStore();

  // Keep recording-specific state in the hook
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  // Essential refs that need to be local to the component
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { append } = useChat({
    api: "/api/chat",
    id: currentChatSessionId ?? "",
    body: {
      chatSessionId: currentChatSessionId,
    },
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

        // Set up MediaRecorder
        if (streamRef.current) {
          const recorder = new MediaRecorder(streamRef.current, {
            mimeType: "video/webm; codecs=vp9", // Or other supported mimeType
          });

          recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
              chunksRef.current.push(event.data);
            }
          };

          recorder.onstop = () => {
            const recordedBlob = new Blob(chunksRef.current, {
              type: "video/webm", // Match the mimeType
            });
            const url = URL.createObjectURL(recordedBlob);
            setVideoUrl(url);
            setRecordedBlob(recordedBlob);
            setRecordingState("stopped");

            // Ensure the playback video element is properly updated
            if (playbackVideoRef.current) {
              // First, completely disconnect the preview video
              if (previewVideoRef.current) {
                previewVideoRef.current.pause();
                previewVideoRef.current.style.display = "none";
              }

              // Clear any existing srcObject to ensure it doesn't show the preview stream
              playbackVideoRef.current.srcObject = null;

              // Set the src to the recorded video URL
              playbackVideoRef.current.src = url;

              // Make sure the playback video is visible
              playbackVideoRef.current.style.display = "block";

              // Load and play the recorded video
              playbackVideoRef.current.load();

              // Small delay to ensure the video loads properly before playing
              setTimeout(() => {
                if (playbackVideoRef.current) {
                  playbackVideoRef.current.play().catch((err) => {
                    console.error("Error playing recorded video:", err);
                  });
                }
              }, 100);
            }

            chunksRef.current = []; // Reset chunks for next recording
          };

          mediaRecorderRef.current = recorder;
        }

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
    [selectedVideoDeviceId, selectedAudioDeviceId, setVideoUrl]
  );

  const startRecording = useCallback(() => {
    if (
      !streamRef.current ||
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state !== "inactive"
    )
      return;

    // Clear previous recording chunks
    chunksRef.current = [];

    // Hide chat interface when starting recording
    setShowChat(false);
    setHasAnalyzedVideo(false);
    setMessages([]);
    setCurrentChatSessionId(null);

    try {
      mediaRecorderRef.current.start();
      setRecordingState("recording");
      setRecordingTime(0);
      intervalRef.current = setInterval(() => {
        setRecordingTime((time) => time + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  }, [setShowChat, setHasAnalyzedVideo, setMessages, setCurrentChatSessionId]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        // First, completely disconnect the preview video to prevent it from showing
        if (previewVideoRef.current) {
          // Pause the preview video but don't stop tracks yet
          previewVideoRef.current.pause();
          previewVideoRef.current.style.display = "none";
        }

        // Now stop the recording - this will trigger recorder.onstop
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("Error stopping MediaRecorder:", error);
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, []);

  const analyzeVideo = useCallback(async () => {
    if (!recordedBlob) return;

    setRecordingState("uploading");

    try {
      // Step 1: Upload video file and get Google URI
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

      // Set the current chat session ID
      setCurrentChatSessionId(uploadResult.chatSessionId);

      // Step 2: Set state to processing before starting AI analysis
      setRecordingState("processing");
      setHasAnalyzedVideo(true);
      // Show chat interface after analysis
      setShowChat(true);

      // Step 3: Send message with video using experimental_attachments
      await append(
        {
          role: "user",
          content:
            "Please analyze my speech from the video I just uploaded and provide detailed feedback on my articulation skills.",
        },
        {
          experimental_attachments: [
            {
              name: "recording.webm",
              contentType: uploadResult.mimeType,
              url: uploadResult.googleFileUri,
            },
          ],
          body: {
            chatSessionId: uploadResult.chatSessionId,
          },
        }
      );
    } catch (error) {
      console.error("Error analyzing video:", error);
      setRecordingState("stopped");
    }
  }, [
    recordedBlob,
    append,
    setCurrentChatSessionId,
    setHasAnalyzedVideo,
    setShowChat,
  ]);

  const resetRecording = useCallback(() => {
    // Clear local state
    setRecordingState("idle");
    setRecordedBlob(null);
    setRecordingTime(0);

    // Reset global state
    resetGlobalState();

    // Clear chunks
    chunksRef.current = [];

    // Clear playback video
    if (playbackVideoRef.current) {
      playbackVideoRef.current.src = "";
      playbackVideoRef.current.srcObject = null;
      playbackVideoRef.current.style.display = "none";
      playbackVideoRef.current.load();
    }

    // Show preview video
    if (previewVideoRef.current) {
      previewVideoRef.current.style.display = "block";
      if (streamRef.current && !previewVideoRef.current.srcObject) {
        previewVideoRef.current.srcObject = streamRef.current;
        previewVideoRef.current.play().catch((err) => {
          console.error("Error playing preview video:", err);
        });
      }
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
  }, [initializeCamera, resetGlobalState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleDeviceChange = useCallback(() => {
    // No longer need to receive parameters since the component will update the global state directly
    // Just need to re-initialize camera with current global state values
    if (hasPermissions) {
      initializeCamera();
    }
  }, [hasPermissions, initializeCamera]);

  // Add effect to monitor device changes in global state
  useEffect(() => {
    // When device selection changes in global state, reinitialize camera
    if (hasPermissions && streamRef.current) {
      initializeCamera();
    }
  }, [
    selectedVideoDeviceId,
    selectedAudioDeviceId,
    hasPermissions,
    initializeCamera,
  ]);

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
  }, [initializeCamera, hasPermissions]);

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
  }, [hasPermissions]);

  // Effect to detect when analysis is complete
  useEffect(() => {
    if (recordingState === "processing" && !isLoading && messages.length > 0) {
      // Analysis is complete, reset to stopped state
      setRecordingState("stopped");
    }
  }, [recordingState, isLoading, messages.length]);

  // Add a function to load video from a file path
  const loadVideoFromPath = useCallback(
    (filePath: string) => {
      // Convert Windows path separators and encode each segment
      const pathSegments = filePath.replace(/\\/g, "/").split("/");
      const encodedSegments = pathSegments.map((segment) =>
        encodeURIComponent(segment)
      );
      const videoApiUrl = `/api/video/${encodedSegments.join("/")}`;

      console.log("Loading video from path:", filePath);
      console.log("API URL:", videoApiUrl);

      // Stop the live camera stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Completely disconnect the preview video
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = null;
        previewVideoRef.current.src = "";
        previewVideoRef.current.style.display = "none";
        previewVideoRef.current.load();
      }

      // Set up for playback mode
      setVideoUrl(videoApiUrl);
      setHasAnalyzedVideo(true);
      setRecordingState("stopped");

      // Set up the playback video element with a delay to ensure state updates have completed
      setTimeout(() => {
        if (playbackVideoRef.current) {
          // Make sure the playback video is visible
          playbackVideoRef.current.style.display = "block";
          // Clear any existing srcObject
          playbackVideoRef.current.srcObject = null;
          // Set the src to the video URL
          playbackVideoRef.current.src = videoApiUrl;
          // Load and play the video
          playbackVideoRef.current.load();
          playbackVideoRef.current.play().catch((err) => {
            console.error("Error playing database video:", err);
          });
        }
      }, 200);
    },
    [setVideoUrl, setHasAnalyzedVideo]
  );

  // Export the hook
  return {
    recordingState,
    hasPermissions,
    recordingTime,
    hasAnalyzedVideo,
    messages,
    isLoading,
    currentChatSessionId,
    showChat,
    previewVideoRef,
    playbackVideoRef,
    streamRef,
    initializeCamera,
    startRecording,
    stopRecording,
    analyzeVideo,
    resetRecording,
    formatTime,
    handleDeviceChange,
    append,
    loadVideoFromPath,
  };
};
