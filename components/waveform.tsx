"use client";

import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

const Waveform = () => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (waveformRef.current) {
      // Create WaveSurfer instance
      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#4F4A85",
        progressColor: "#383351",
        cursorColor: "#333",
        barWidth: 1,
        barRadius: 3,
        cursorWidth: 1,
        height: 60,
        minPxPerSec: 100,
        barGap: 1,
        url: "/sample-video.mp4", // Using the video file
      });

      wavesurferRef.current = wavesurfer;

      // Add event listeners
      wavesurfer.on("play", () => setIsPlaying(true));
      wavesurfer.on("pause", () => setIsPlaying(false));
      wavesurfer.on("finish", () => setIsPlaying(false));
      wavesurfer.on("ready", () => {
        setIsLoading(false);
        setError(null);
        setDuration(wavesurfer.getDuration());
      });
      wavesurfer.on("error", (err) => {
        setIsLoading(false);
        setError(
          "Failed to load video file. Please check if the file exists and has an audio track."
        );
        console.error("WaveSurfer error:", err);
      });
      wavesurfer.on("timeupdate", (time) => {
        setCurrentTime(time);
      });

      // Cleanup function
      return () => {
        wavesurfer.destroy();
      };
    }
  }, []);

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (wavesurferRef.current) {
      wavesurferRef.current.setVolume(newVolume);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-8xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Video Audio Waveform
        </h3>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading audio...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">
              Make sure you have a video file (MP4, etc.) in the public folder
              named "sample-video.mp4" with an audio track
            </p>
          </div>
        )}

        <div ref={waveformRef} className="mb-4" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              disabled={isLoading || !!error}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>

            <div className="text-sm text-gray-600">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20"
            />
            <span className="text-sm text-gray-600">
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Waveform;
