import Header from "@/components/header/Header";
import VideoRecorder from "../components/VideoRecorder";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Header />
      <VideoRecorder />
    </div>
  );
}
