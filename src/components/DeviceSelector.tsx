import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Mic, Settings } from "lucide-react";

interface DeviceSelectorProps {
  onDeviceChange: (
    videoDeviceId: string | null,
    audioDeviceId: string | null
  ) => void;
  disabled?: boolean;
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  onDeviceChange,
  disabled = false,
}) => {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string | null>(
    null
  );
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(
    null
  );

  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permissions first to get device labels
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        stream.getTracks().forEach((track) => track.stop());

        const devices = await navigator.mediaDevices.enumerateDevices();

        const videoInputs = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput"
        );

        setVideoDevices(
          videoInputs.map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
            kind: device.kind,
          }))
        );

        setAudioDevices(
          audioInputs.map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
            kind: device.kind,
          }))
        );

        // Set defaults to first available devices
        if (videoInputs.length > 0 && !selectedVideoDevice) {
          setSelectedVideoDevice(videoInputs[0].deviceId);
        }
        if (audioInputs.length > 0 && !selectedAudioDevice) {
          setSelectedAudioDevice(audioInputs[0].deviceId);
        }
      } catch (error) {
        console.error("Error getting media devices:", error);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    onDeviceChange(selectedVideoDevice, selectedAudioDevice);
  }, [selectedVideoDevice, selectedAudioDevice, onDeviceChange]);

  return (
    <div className="space-y-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
      <div className="flex items-center gap-2 text-white">
        <Settings className="w-4 h-4" />
        <h3 className="font-semibold">Device Settings</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/80">
            <Camera className="w-4 h-4" />
            <label className="text-sm font-medium">Camera</label>
          </div>
          <Select
            value={selectedVideoDevice || ""}
            onValueChange={setSelectedVideoDevice}
            disabled={disabled}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select camera" />
            </SelectTrigger>
            <SelectContent>
              {videoDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Microphone Selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/80">
            <Mic className="w-4 h-4" />
            <label className="text-sm font-medium">Microphone</label>
          </div>
          <Select
            value={selectedAudioDevice || ""}
            onValueChange={setSelectedAudioDevice}
            disabled={disabled}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioDevices.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
