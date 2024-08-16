import React, { useEffect } from "react";
import { showTemporaryMessage } from "../utils/temporaryMessage";
import "../styles/Navbar.css";

function Navbar({ 
  isDrawing, 
  setIsDrawing, 
  geometryType, 
  setGeometryType, 
  toggleDataTable, 
  isUpdating,
  isDataTableVisible
}) {
  useEffect(() => {
    if (isDrawing) {
      showTemporaryMessage(`Started adding ${geometryType}`, 1000);
    }
  }, [geometryType, isDrawing]);

  const handleAddGeometryClick = () => {
    if (isUpdating || isDataTableVisible) return; 
    setIsDrawing(!isDrawing);
    if (!isDrawing) {
      showTemporaryMessage(`Started adding ${geometryType}`, 1000);
    } else {
      showTemporaryMessage(`Stopped adding ${geometryType}`, 1000);
    }
  };

  const handleGeometryTypeChange = (e) => {
    if (isUpdating || isDataTableVisible) return; 
    const newGeometryType = e.target.value;
    setGeometryType(newGeometryType);
    if (isDrawing) {
      showTemporaryMessage(`Started adding ${newGeometryType}`, 1000);
    }
  };

  const handleSearchClick = () => {
    if (isUpdating) return; 
    if (isDrawing) {
      setIsDrawing(false);
      showTemporaryMessage(`Stopped adding ${geometryType}`, 1000);
    }
    toggleDataTable();
  };

  return (
    <nav>
      <div className="navbar-content">
        <h1>MapApp</h1>
        <div className="button-container">
          <div className="geometry-controls">
            <select
              id="geometry-type"
              value={geometryType}
              onChange={handleGeometryTypeChange}
              disabled={isUpdating || isDataTableVisible}
            >
              <option value="Point">Point</option>
              <option value="LineString">LineString</option>
              <option value="Polygon">Polygon</option>
            </select>
            <button 
              id="add-geometry-btn" 
              onClick={handleAddGeometryClick}
              disabled={isUpdating || isDataTableVisible}
            >
              {isDrawing ? "Stop Adding" : "Add Geometry"}
            </button>
          </div>
          <button 
            id="search-btn" 
            onClick={handleSearchClick}
            disabled={isUpdating}
          >
            {isDataTableVisible ? "Close Search" : "Search"}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;