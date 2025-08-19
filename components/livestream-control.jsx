"use client"

import React, { useState, useEffect, useRef } from "react"
import axios from "axios"
import Draggable from "react-draggable"
import flvjs from "flv.js"


const API_BASE_URL = "http://localhost:5000/api"

// Helper component for Draggable Overlays
const DraggableItem = ({ overlay, onStop, onClick, isSelected }) => {
  const nodeRef = React.useRef(null);
  const isText = overlay.type === 'text';

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={overlay.position}
      onStop={(e, data) => onStop(overlay._id, { x: data.x, y: data.y })}
      bounds="parent"
    >
      <div 
        ref={nodeRef} 
        onClick={() => onClick(overlay)}
        style={{ 
          position: "absolute", 
          cursor: "pointer", 
          zIndex: 10,
          padding: "4px 8px", 
          backgroundColor: isSelected ? "rgba(59, 130, 246, 0.3)" : "rgba(0,0,0,0.3)",
          borderRadius: "4px", 
          border: isSelected ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.2)",
        }}
      >
        {isText ? (
          <span style={{ fontSize: `${overlay.size.height}px`, color: overlay.color || 'white', textShadow: "2px 2px 4px black", whiteSpace: 'nowrap' }}>
            {overlay.content}
          </span>
        ) : (
          <img src={`http://localhost:5000${overlay.content}`} alt="overlay" style={{ height: `${overlay.size.height}px`, width: `${overlay.size.width}px`, pointerEvents: 'none' }} />
        )}
      </div>
    </Draggable>
  );
};

// Main Application Component
const LivestreamControl = () => {
  const videoRef = useRef(null);
  const flvPlayerRef = useRef(null);
  
  // State
  const [rtspUrl, setRtspUrl] = useState("rtsp://localhost:554/live");
  const [overlays, setOverlays] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState("");
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formState, setFormState] = useState({
    type: 'text',
    content: '',
    logoFile: null,
    x: 50,
    y: 50,
    width: 150,
    height: 32,
    color: '#ffffff'
  });

  const fetchOverlays = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/overlays`);
      setOverlays(response.data);
    } catch (err) {
      setError("Failed to fetch overlays. Is the backend running?");
    }
  };

  const initializePlayer = () => {
    if (flvPlayerRef.current) flvPlayerRef.current.destroy();
    if (videoRef.current && flvjs.isSupported()) {
      const player = flvjs.createPlayer({
        type: "flv", url: "http://localhost:8000/live/stream.flv", isLive: true,
      });
      player.attachMediaElement(videoRef.current);
      player.on(flvjs.Events.ERROR, (errDetail) => setError(`Stream error: ${errDetail}`));
      player.load();
      player.play();
      flvPlayerRef.current = player;
      setIsStreaming(true);
      setError("");
    }
  };

  const destroyPlayer = () => {
    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }
    setIsStreaming(false);
  };

  const startStream = async () => {
    try {
      setError("");
      await axios.post(`${API_BASE_URL}/stream/start`, { rtspUrl });
      setTimeout(initializePlayer, 3000);
    } catch (err) {
      setError("Failed to start stream.");
    }
  };

  const stopStream = async () => {
    try {
      await axios.post(`${API_BASE_URL}/stream/stop`);
      destroyPlayer();
    } catch (err) {
      setError("Failed to stop stream.");
    }
  };

  const restartStream = async () => {
    try {
      destroyPlayer();
      await axios.post(`${API_BASE_URL}/stream/restart`, { rtspUrl });
      setTimeout(initializePlayer, 3000);
      alert('Stream restarting with latest overlays!');
    } catch (err) {
      setError("Failed to restart stream");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormState(prev => ({ ...prev, logoFile: e.target.files[0] }));
  };

  const handleEditClick = (overlay) => {
    setEditingId(overlay._id);
    setFormState({
      type: overlay.type,
      content: overlay.type === 'text' ? overlay.content : '',
      logoFile: null,
      x: overlay.position.x,
      y: overlay.position.y,
      width: overlay.size.width,
      height: overlay.size.height,
      color: overlay.color || '#ffffff'
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormState({
      type: 'text', content: '', logoFile: null, x: 50, y: 50, width: 150, height: 32, color: '#ffffff'
    });
  };

  const handleSubmitOverlay = async (e) => {
    e.preventDefault();
    let contentValue = formState.content;

    if (formState.type === 'logo') {
      if (formState.logoFile) {
        const formData = new FormData();
        formData.append('logo', formState.logoFile);
        try {
          const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData);
          contentValue = uploadRes.data.filePath;
        } catch (err) {
          setError("Failed to upload logo."); return;
        }
      } else if (!editingId) {
        alert("Please select a logo file for new overlays."); return;
      }
    }

    const payload = {
      type: formState.type,
      content: contentValue,
      position: { x: parseInt(formState.x), y: parseInt(formState.y) },
      size: { width: parseInt(formState.width), height: parseInt(formState.height) },
      color: formState.color
    };
    
    try {
      if (editingId) {
        // We must include the original content if we are not uploading a new file for a logo
        if (formState.type === 'logo' && !formState.logoFile) {
            const originalOverlay = overlays.find(o => o._id === editingId);
            payload.content = originalOverlay.content;
        }
        await axios.put(`${API_BASE_URL}/overlays/${editingId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/overlays`, payload);
      }
      fetchOverlays();
      resetForm();
    } catch(err) {
      setError(`Failed to ${editingId ? 'update' : 'create'} overlay.`);
    }
  };

  const deleteOverlay = async (id) => {
    await axios.delete(`${API_BASE_URL}/overlays/${id}`);
    fetchOverlays();
    if (editingId === id) {
      resetForm();
    }
  };

  const handleOverlayDragStop = async (id, position) => {
    await axios.put(`${API_BASE_URL}/overlays/${id}`, { position });
  };
  
  useEffect(() => {
    fetchOverlays();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", color: "white" }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", padding: "24px", height: "100vh" }}>
        
        <div style={{ backgroundColor: "#1a1a1a", borderRadius: "12px", padding: "24px", position: "relative" }}>
          <h2 style={{ marginBottom: "16px", fontSize: "24px", fontWeight: "bold" }}>Live Stream</h2>
          <div style={{ position: "relative", backgroundColor: "#000", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9" }}>
            <video ref={videoRef} style={{ width: "100%", height: "100%" }} controls muted />
            {overlays.map((overlay) => (
              <DraggableItem 
                key={overlay._id} 
                overlay={overlay} 
                onStop={handleOverlayDragStop} 
                onClick={handleEditClick} 
                isSelected={editingId === overlay._id}
              />
            ))}
          </div>
          <button onClick={restartStream} style={{width: '100%', marginTop: '20px', padding: '15px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px'}}>Apply Overlay Changes</button>
          {error && (<div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#dc2626", borderRadius: "6px" }}>{error}</div>)}
        </div>

        <div style={{ backgroundColor: "#1a1a1a", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }}>
          <div>
            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Stream Controls</h3>
            <input type="text" value={rtspUrl} onChange={(e) => setRtspUrl(e.target.value)} placeholder="rtsp://..." style={{ width: "100%", padding: "8px", color: 'black', borderRadius: '4px' }} />
            <div style={{ marginTop: "8px" }}>
              <button onClick={startStream} disabled={isStreaming}>Start Stream</button>
              <button onClick={stopStream} disabled={!isStreaming}>Stop Stream</button>
            </div>
          </div>
          
          <form onSubmit={handleSubmitOverlay}>
            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>{editingId ? "Edit Overlay" : "Create New Overlay"}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <select name="type" value={formState.type} onChange={handleFormChange} style={{color: 'black', padding: '8px', borderRadius: '4px'}}>
                    <option value="text">Text Overlay</option>
                    <option value="logo">Logo Overlay</option>
                </select>

                {formState.type === 'text' ? (
                <>
                    <input name="content" type="text" placeholder="Overlay text" value={formState.content} onChange={handleFormChange} required style={{color: 'black', padding: '8px', borderRadius: '4px'}} />
                    <label>Color: <input name="color" type="color" value={formState.color} onChange={handleFormChange} style={{height: '40px', width: '100%', borderRadius: '4px'}} /></label>
                </>
                ) : (
                <>
                    <label>Logo File:</label>
                    <input name="logoFile" type="file" onChange={handleFileChange} accept="image/png, image/jpeg" required={!editingId} />
                </>
                )}
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                    <input name="x" type="number" placeholder="X Position" value={formState.x} onChange={handleFormChange} style={{color: 'black', padding: '8px', borderRadius: '4px'}} />
                    <input name="y" type="number" placeholder="Y Position" value={formState.y} onChange={handleFormChange} style={{color: 'black', padding: '8px', borderRadius: '4px'}} />
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px'}}>
                    <input name="width" type="number" placeholder="Width (px)" value={formState.width} onChange={handleFormChange} style={{color: 'black', padding: '8px', borderRadius: '4px'}} />
                    <input name="height" type="number" placeholder={formState.type === 'text' ? 'Font Size' : 'Height (px)'} value={formState.height} onChange={handleFormChange} style={{color: 'black', padding: '8px', borderRadius: '4px'}} />
                </div>

                <button type="submit">{editingId ? "Update Overlay" : "Add Overlay"}</button>
                {editingId && <button type="button" onClick={resetForm}>Cancel Edit</button>}
            </div>
          </form>

          <div>
            <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Active Overlays ({overlays.length})</h3>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {overlays.map((overlay) => (
                <div key={overlay._id} style={{ padding: "10px", backgroundColor: editingId === overlay._id ? "#4a5568" : "#2a2a2a", borderRadius: "6px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                  <span style={{maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{overlay.type}: {overlay.type === 'logo' ? overlay.content.split('/').pop() : overlay.content}</span>
                  <div>
                    <button onClick={() => handleEditClick(overlay)} style={{marginRight: '5px'}}>Edit</button>
                    <button onClick={() => deleteOverlay(overlay._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivestreamControl;