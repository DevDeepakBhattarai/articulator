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
  compact?: boolean;
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  onDeviceChange,
  disabled = false,
  compact = false,
}) => {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string | null>(
    null
  );
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getDevices = async () => {
      try {
        setIsLoading(true);

        // Try to get devices without permissions first
        let devices = await navigator.mediaDevices.enumerateDevices();

        // If device labels are empty, request permissions to get labels
        if (devices.some((device) => !device.label)) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
            stream.getTracks().forEach((track) => track.stop());
            devices = await navigator.mediaDevices.enumerateDevices();
          } catch (permissionError) {
            console.log(
              "Permissions not granted, using devices without labels"
            );
          }
        }

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
      } finally {
        setIsLoading(false);
      }
    };

    getDevices();
  }, []);

  useEffect(() => {
    // Only call onDeviceChange if we have at least one device selected
    if (selectedVideoDevice || selectedAudioDevice) {
      onDeviceChange(selectedVideoDevice, selectedAudioDevice);
    }
  }, [selectedVideoDevice, selectedAudioDevice]);

  if (compact) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full max-w-sm sm:max-w-none mx-auto">
        {/* Compact Camera Selection */}
        <div className="flex-1 min-w-0">
          <Select
            value={selectedVideoDevice || ""}
            onValueChange={setSelectedVideoDevice}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs sm:text-sm h-8 sm:h-9 w-full">
              <div className="flex items-center gap-1">
                <Camera className="w-3 h-3 flex-shrink-0" />
                <SelectValue
                  placeholder={isLoading ? "Loading..." : "Camera"}
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading-cameras" disabled>
                  Loading cameras...
                </SelectItem>
              ) : videoDevices.length === 0 ? (
                <SelectItem value="no-cameras" disabled>
                  No cameras found
                </SelectItem>
              ) : (
                videoDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Compact Microphone Selection */}
        <div className="flex-1 min-w-0">
          <Select
            value={selectedAudioDevice || ""}
            onValueChange={setSelectedAudioDevice}
            disabled={disabled || isLoading}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-xs sm:text-sm h-8 sm:h-9 w-full">
              <div className="flex items-center gap-1">
                <Mic className="w-3 h-3 flex-shrink-0" />
                <SelectValue
                  placeholder={isLoading ? "Loading..." : "Microphone"}
                />
              </div>
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading-microphones" disabled>
                  Loading microphones...
                </SelectItem>
              ) : audioDevices.length === 0 ? (
                <SelectItem value="no-microphones" disabled>
                  No microphones found
                </SelectItem>
              ) : (
                audioDevices.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

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
