// src/components/VideoPlayer.jsx
import React, { useEffect, useRef } from 'react';
import flv from 'flv.js';

const VideoPlayer = ({ isStreaming }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (isStreaming && videoRef.current) {
      const flvPlayer = flv.createPlayer({
        type: 'flv',
        isLive: true,
        url: 'http://localhost:8000/live/stream.flv',
      });
      flvPlayer.attachMediaElement(videoRef.current);
      flvPlayer.load();
      flvPlayer.play();
      playerRef.current = flvPlayer;
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isStreaming]);

  return <video ref={videoRef} style={{ width: '100%', display: 'block' }} controls muted />;
};

export default VideoPlayer;