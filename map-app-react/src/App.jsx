import React, { useState } from "react";
import MapView from "./components/MapView";
import Navbar from "./components/Navbar";
import './styles/Utils.css';

function App() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [geometryType, setGeometryType] = useState("Point");
  const [isDataTableVisible, setIsDataTableVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleDataTable = () => {
    setIsDataTableVisible(!isDataTableVisible);
    if (!isDataTableVisible) {
      setIsDrawing(false);
    }
  };

  return (
    <div className="App">
      <Navbar
        isDrawing={isDrawing}
        setIsDrawing={setIsDrawing}
        geometryType={geometryType}
        setGeometryType={setGeometryType}
        toggleDataTable={toggleDataTable}
        isUpdating={isUpdating}
        isDataTableVisible={isDataTableVisible}
      />
      <MapView
        isDrawing={isDrawing}
        geometryType={geometryType}
        isDataTableVisible={isDataTableVisible}
        toggleDataTable={toggleDataTable}
        isUpdating={isUpdating}
        setIsUpdating={setIsUpdating}
      />
    </div>
  );
}

export default App;