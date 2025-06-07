"use client";
import Header from "@/components/header/Header";
import VideoRecorder from "../components/VideoRecorder";
import { useArticulatorStore } from "@/states/useArticulatorStore";
import { ChatInterface } from "@/components/ChatInterface";

export default function Home() {
  const { showChat } = useArticulatorStore();
  return (
    <div className="flex flex-col max-h-screen overflow-y-auto">
      <Header />
      <div className="flex items-center justify-center h-full p-6 w-full gap-2">
        {showChat && <ChatInterface />}
        <VideoRecorder />
      </div>
    </div>
  );
}
