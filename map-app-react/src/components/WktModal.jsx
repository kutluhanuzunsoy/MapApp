import React, { useState, useEffect } from 'react';
import WKT from 'ol/format/WKT';
import '../styles/WktModal.css';

function WktModal({ isOpen, onClose, currentWkt, onUpdate }) {
  const [wktInput, setWktInput] = useState(currentWkt);

  useEffect(() => {
    setWktInput(currentWkt);
  }, [currentWkt]);

  const handleUpdate = () => {
    const newWkt = wktInput.trim();
    
    if (newWkt === "") {
      alert("WKT cannot be empty. Please enter a valid WKT.");
      return;
    }

    try {
      const geometry = new WKT().readGeometry(newWkt);
      const geometryType = geometry.getType();
      
      if (window.confirm(`Are you sure you want to update the ${geometryType}?`)) {
        onUpdate(newWkt);
      }
    } catch (error) {
      alert("Invalid WKT format. Please enter a valid WKT.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Edit WKT</h2>
        <textarea
          id="wkt-textarea"
          value={wktInput}
          onChange={(e) => setWktInput(e.target.value)}
          rows={10}
        ></textarea>
        <button id="update-wkt-btn" onClick={handleUpdate}>Update</button>
      </div>
    </div>
  );
}

export default WktModal;