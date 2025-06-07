import { create } from "zustand";
import { Message } from "@ai-sdk/react";

interface ArticulatorState {
  // Global UI state
  videoUrl: string;
  hasAnalyzedVideo: boolean;
  currentChatSessionId: string | null;
  showChat: boolean;
  messages: Message[];
  isLoading: boolean;

  // Device preferences
  selectedVideoDeviceId: string | null;
  selectedAudioDeviceId: string | null;

  // Actions
  setVideoUrl: (url: string) => void;
  setHasAnalyzedVideo: (hasAnalyzed: boolean) => void;
  setCurrentChatSessionId: (id: string | null) => void;
  setShowChat: (show: boolean) => void;
  setMessages: (messages: Message[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setSelectedVideoDeviceId: (id: string | null) => void;
  setSelectedAudioDeviceId: (id: string | null) => void;
  resetGlobalState: () => void;
}

// Load device preferences from localStorage
const getInitialVideoDevice = () => {
  try {
    return localStorage.getItem("preferred-video-device");
  } catch {
    return null;
  }
};

const getInitialAudioDevice = () => {
  try {
    return localStorage.getItem("preferred-audio-device");
  } catch {
    return null;
  }
};

export const useArticulatorStore = create<ArticulatorState>((set) => ({
  // Initial state
  videoUrl: "",
  hasAnalyzedVideo: false,
  currentChatSessionId: null,
  showChat: true,
  messages: [],
  isLoading: false,

  // Device preferences
  selectedVideoDeviceId: getInitialVideoDevice(),
  selectedAudioDeviceId: getInitialAudioDevice(),

  // Actions
  setVideoUrl: (url) => set({ videoUrl: url }),
  setHasAnalyzedVideo: (hasAnalyzed) => set({ hasAnalyzedVideo: hasAnalyzed }),
  setCurrentChatSessionId: (id) => set({ currentChatSessionId: id }),
  setShowChat: (show) => set({ showChat: show }),
  setMessages: (messages) => set({ messages }),
  setIsLoading: (isLoading) => set({ isLoading }),

  setSelectedVideoDeviceId: (id) => {
    try {
      if (id) {
        localStorage.setItem("preferred-video-device", id);
      } else {
        localStorage.removeItem("preferred-video-device");
      }
    } catch (error) {
      console.log("Failed to save video device preference:", error);
    }
    set({ selectedVideoDeviceId: id });
  },

  setSelectedAudioDeviceId: (id) => {
    try {
      if (id) {
        localStorage.setItem("preferred-audio-device", id);
      } else {
        localStorage.removeItem("preferred-audio-device");
      }
    } catch (error) {
      console.log("Failed to save audio device preference:", error);
    }
    set({ selectedAudioDeviceId: id });
  },

  resetGlobalState: () =>
    set({
      videoUrl: "",
      hasAnalyzedVideo: false,
      currentChatSessionId: null,
      messages: [],
      showChat: true,
    }),
}));
