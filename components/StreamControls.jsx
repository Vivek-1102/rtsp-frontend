// src/components/StreamControls.jsx
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const StreamControls = ({ onStreamStateChange }) => {
  const [rtspUrl, setRtspUrl] = useState('rtsp://rtsp.stream/pattern');

  const handleStart = () => {
    axios.post(`${API_URL}/stream/start`, { rtspUrl })
      .then(res => {
        alert(res.data.message);
        onStreamStateChange(true);
      })
      .catch(err => console.error(err));
  };

  const handleStop = () => {
    axios.post(`${API_URL}/stream/stop`)
      .then(res => {
        alert(res.data.message);
        onStreamStateChange(false);
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="controls-card">
      <h3>Stream Controls</h3>
      <label>RTSP Stream URL</label>
      <input
        type="text"
        value={rtspUrl}
        onChange={(e) => setRtspUrl(e.target.value)}
        placeholder="rtsp://your-stream-url"
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleStart}>Start Stream</button>
        <button onClick={handleStop}>Stop Stream</button>
      </div>
    </div>
  );
};

export default StreamControls;