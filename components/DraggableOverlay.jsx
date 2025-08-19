// src/components/DraggableOverlay.jsx
import React, { useRef } from 'react';
import Draggable from 'react-draggable';

const DraggableOverlay = ({ overlay, onStop }) => {
  const nodeRef = useRef(null); // Hook is at the top level, which is correct.

  return (
    <Draggable
      nodeRef={nodeRef}
      defaultPosition={overlay.position}
      onStop={(e, data) => onStop(overlay._id, { x: data.x, y: data.y })}
      bounds="parent"
    >
      <div ref={nodeRef} style={{
        position: 'absolute',
        padding: '5px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'white',
        fontSize: `${overlay.size.height}px`,
        cursor: 'move',
        borderRadius: '5px',
        border: '1px dashed white'
      }}>
        {overlay.content}
      </div>
    </Draggable>
  );
};

export default DraggableOverlay;