import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api";

const OverlayManager = () => {
  const [overlays, setOverlays] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
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

  const styles = {
    card: { marginBottom: '20px', backgroundColor: "#1a1a1a", borderRadius: "12px", padding: "24px" },
    cardTitle: { marginBottom: "16px", fontSize: "18px", fontWeight: "bold" },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    formRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
    label: { marginBottom: '4px', fontSize: '14px', color: '#ccc' },
    input: { width: "100%", padding: "8px", backgroundColor: "#2a2a2a", border: "1px solid #404040", color: "white", borderRadius: '4px' },
    button: { padding: "10px 15px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", backgroundColor: '#3b82f6', color: 'white' },
    overlayList: { maxHeight: "200px", overflowY: "auto" },
    overlayListItem: { padding: "10px", backgroundColor: "#2a2a2a", borderRadius: "6px", marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: 'center' }
  };

  const fetchOverlays = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/overlays`);
      setOverlays(response.data);
    } catch (err) {
      setError("Failed to fetch overlays.");
    }
  };

  useEffect(() => {
    fetchOverlays();
  }, []);

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
    setFormState({ type: 'text', content: '', logoFile: null, x: 50, y: 50, width: 150, height: 32, color: '#ffffff' });
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
        alert("Please select a logo file."); return;
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
      setError(`Failed to save overlay.`);
    }
  };

  const deleteOverlay = async (id) => {
    await axios.delete(`${API_BASE_URL}/overlays/${id}`);
    fetchOverlays();
    if (editingId === id) resetForm();
  };

  return (
    <div>
      <form onSubmit={handleSubmitOverlay} style={styles.card}>
        <h3 style={styles.cardTitle}>{editingId ? "Edit Overlay" : "Create New Overlay"}</h3>
        <div style={styles.form}>
            <label style={styles.label}>Overlay Type</label>
            <select name="type" value={formState.type} onChange={handleFormChange} style={{...styles.input, color: 'white'}}>
                <option value="text" style={{backgroundColor: '#2a2a2a'}}>Text</option>
                <option value="logo" style={{backgroundColor: '#2a2a2a'}}>Logo</option>
            </select>

            {formState.type === 'text' ? (
            <>
                <label style={styles.label}>Text Content</label>
                <input name="content" type="text" value={formState.content} onChange={handleFormChange} required style={styles.input} />
                <label style={styles.label}>Color</label>
                <input name="color" type="color" value={formState.color} onChange={handleFormChange} style={{...styles.input, height: '40px', padding: '4px'}} />
            </>
            ) : (
            <>
                <label style={styles.label}>Logo File</label>
                <input name="logoFile" type="file" onChange={handleFileChange} accept="image/png, image/jpeg" required={!editingId} style={styles.input} />
            </>
            )}
            
            <div style={styles.formRow}>
                <div>
                    <label style={styles.label}>X Position</label>
                    <input name="x" type="number" value={formState.x} onChange={handleFormChange} style={styles.input} />
                </div>
                <div>
                    <label style={styles.label}>Y Position</label>
                    <input name="y" type="number" value={formState.y} onChange={handleFormChange} style={styles.input} />
                </div>
            </div>
            
            <div style={styles.formRow}>
                <div>
                    <label style={styles.label}>Width (px)</label>
                    <input name="width" type="number" value={formState.width} onChange={handleFormChange} style={styles.input} />
                </div>
                <div>
                    <label style={styles.label}>{formState.type === 'text' ? 'Font Size' : 'Height (px)'}</label>
                    <input name="height" type="number" value={formState.height} onChange={handleFormChange} style={styles.input} />
                </div>
            </div>

            <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                <button type="submit" style={{...styles.button, flex: 1}}>{editingId ? "Update Overlay" : "Add Overlay"}</button>
                {editingId && <button type="button" onClick={resetForm} style={{...styles.button, flex: 1, backgroundColor: '#6b7280'}}>Cancel</button>}
            </div>
        </div>
      </form>

      <div style={styles.card}>
        <h3 style={styles.cardTitle}>Active Overlays ({overlays.length})</h3>
        <div style={styles.overlayList}>
          {overlays.map((overlay) => (
            <div key={overlay._id} style={styles.overlayListItem}>
              <span style={{maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                {overlay.type}: {overlay.type === 'logo' ? overlay.content.split('/').pop() : overlay.content}
              </span>
              <div>
                <button onClick={() => handleEditClick(overlay)} style={{...styles.button, marginRight: '5px', backgroundColor: '#6b7280', padding: '5px 10px'}}>Edit</button>
                <button onClick={() => deleteOverlay(overlay._id)} style={{...styles.button, backgroundColor: '#ef4444', padding: '5px 10px'}}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
       {error && (<div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#dc2626", borderRadius: "6px" }}>{error}</div>)}
    </div>
  );
};

export default OverlayManager;