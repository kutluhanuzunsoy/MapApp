import React, { useEffect, useRef, useCallback, useState } from "react";
import { Overlay } from "ol";
import { transform } from "ol/proj";
import { Modify } from "ol/interaction";
import { updateGeometry, deleteGeometry } from "../services/api";
import { Collection } from "ol";
import { showTemporaryMessage } from "../utils/temporaryMessage";
import { equals as coordinatesEqual } from 'ol/coordinate';
import "../styles/Popup.css";

function Popup({ map, source, isDrawing, popupPosition, setPopupPosition, setIsUpdating }) {
  const popupRef = useRef();
  const overlayRef = useRef();
  const modifyRef = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [editingFeature, setEditingFeature] = useState(null);
  const originalGeometryRef = useRef(null);
  const [showNameUpdate, setShowNameUpdate] = useState(false);
  const [nameUpdateMessage, setNameUpdateMessage] = useState("");
  const [nameUpdateCallback, setNameUpdateCallback] = useState(null);
  const [newName, setNewName] = useState("");

  const handleConfirmKeyPress = useCallback(
    (event) => {
      if (event.key === "Enter" && showConfirm) {
        event.preventDefault();
        confirmCallback(true);
        setShowConfirm(false);
      }
    },
    [showConfirm, confirmCallback]
  );

  useEffect(() => {
    if (showConfirm) {
      document.addEventListener("keydown", handleConfirmKeyPress);
      return () => {
        document.removeEventListener("keydown", handleConfirmKeyPress);
      };
    }
  }, [showConfirm, handleConfirmKeyPress]);

  useEffect(() => {
    if (!map) return;

    const overlay = new Overlay({
      element: popupRef.current,
      autoPan: {
        animation: {
          duration: 250,
        },
        margin: 60,
      },
    });

    map.addOverlay(overlay);
    overlayRef.current = overlay;

    return () => {
      map.removeOverlay(overlay);
    };
  }, [map]);

  useEffect(() => {
    if (overlayRef.current) {
      overlayRef.current.setPosition(popupPosition);
    }
  }, [popupPosition]);

  const showGeometryUpdateMessage = useCallback((feature) => {
    const messageElement = document.createElement("div");
    const type = feature.getGeometry().getType();
    const geoName = feature.get("name");

    messageElement.className = "map-message";
    messageElement.textContent = `Updating the ${type} '${geoName}'. ${
      type === "Point" ? "Drop" : "Double-click"
    } or press 'Enter' to confirm`;
    document.body.appendChild(messageElement);
  }, []);

  const removeGeometryUpdateMessage = useCallback(() => {
    const messageElement = document.querySelector(".map-message");
    if (messageElement) {
      document.body.removeChild(messageElement);
    }
  }, []);

  const handleDelete = useCallback(
    (feature) => {
      const type = feature.getGeometry().getType();
      const geoName = feature.get("name");

      setConfirmMessage(
        `Are you sure you want to delete the ${type} '${geoName}'?`
      );
      setConfirmCallback(() => async (confirmed) => {
        if (confirmed) {
          source.removeFeature(feature);

          const result = await deleteGeometry(feature);
          if (result.success) {
            showTemporaryMessage(`${type} '${geoName}' deleted successfully`);
          } else {
            showTemporaryMessage(`Failed to delete ${type} '${geoName}'`);
            console.error("Failed to delete geometry:", result.error);
            source.addFeature(feature);
          }
        } else {
          showTemporaryMessage(`Deletion of ${type} '${geoName}' cancelled`);
        }
        setPopupPosition(undefined);
      });
      setShowConfirm(true);
    },
    [source, setPopupPosition]
  );

  const isGeometryChanged = useCallback((geometry1, geometry2) => {
    if (!geometry1 || !geometry2 || geometry1.getType() !== geometry2.getType()) {
      return true;
    }
  
    const coords1 = geometry1.getCoordinates();
    const coords2 = geometry2.getCoordinates();
  
    if (geometry1.getType() === 'Point') {
      return !coordinatesEqual(coords1, coords2);
    }
  
    if (geometry1.getType() === 'LineString') {
      if (coords1.length !== coords2.length) {
        return true;
      }
      return coords1.some((coord, index) => !coordinatesEqual(coord, coords2[index]));
    }
  
    if (geometry1.getType() === 'Polygon') {
      if (coords1.length !== coords2.length) {
        return true;
      }
      return coords1.some((ring, ringIndex) => 
        ring.length !== coords2[ringIndex].length || 
        ring.some((coord, coordIndex) => !coordinatesEqual(coord, coords2[ringIndex][coordIndex]))
      );
    }
  
    return !geometry1.getExtent().equals(geometry2.getExtent());
  }, []);

  const handleNameUpdate = useCallback(
    (feature) => {
      const type = feature.getGeometry().getType();
      const currentName = feature.get("name");
  
      setNameUpdateMessage(`Enter new name for the ${type} '${currentName}':`);
      setNewName(currentName);
      setNameUpdateCallback(() => async (result) => {
        if (result.cancelled) {
          showTemporaryMessage(`${type} '${currentName}' name update cancelled`);
        } else {
          const newName = result.value.trim();
          if (newName === "") {
            showTemporaryMessage(`Update Failed: ${type} name cannot be empty`);
          } else if (newName === currentName) {
            showTemporaryMessage(`${type} '${currentName}' name unchanged`);
          } else {
            try {
              feature.set("name", newName);
              const result = await updateGeometry(feature, map);
              if (result.success) {
                showTemporaryMessage(
                  `${type}'s name updated from '${currentName}' to '${newName}'`
                );
              } else {
                showTemporaryMessage(`Failed to update ${type} '${currentName}' name`);
                console.error("Failed to update geometry name:", result.error);
                feature.set("name", currentName);
              }
            } catch (error) {
              showTemporaryMessage("Error during name update process");
              console.error("Error during name update process:", error);
              feature.set("name", currentName);
            }
          }
        }
        setPopupPosition(undefined);
      });
      setShowNameUpdate(true);
    },
    [map, setPopupPosition]
  );

  const handleGeometryUpdate = useCallback(
    (feature) => {
      if (feature.get("isNewFeature")) {
        return;
      }

      setPopupPosition(undefined);
      showGeometryUpdateMessage(feature);
      setEditingFeature(feature);
      setIsUpdating(true);

      originalGeometryRef.current = feature.getGeometry().clone();

      const modify = new Modify({
        features: new Collection([feature]),
      });
      modifyRef.current = modify;
      map.addInteraction(modify);

      const handleModifyEnd = () => {
        const type = feature.getGeometry().getType();
        const geoName = feature.get("name");

        const updatedGeometry = feature.getGeometry();
        
        const geometryChanged = isGeometryChanged(originalGeometryRef.current, updatedGeometry);

        if (!geometryChanged) {
          showTemporaryMessage(`Nothing changed in ${type} '${geoName}'`);
          cleanupGeometryUpdate();
          return;
        }

        setConfirmMessage(`Do you want to update the ${type} '${geoName}'?`);
        setConfirmCallback(() => async (confirmed) => {
          try {
            if (confirmed) {
              const result = await updateGeometry(feature, map);
              if (result.success) {
                showTemporaryMessage(
                  `${type} '${geoName}' updated successfully`
                );
              } else {
                showTemporaryMessage(`Failed to update ${type} '${geoName}'`);
                console.error("Failed to update geometry:", result.error);
                feature.setGeometry(originalGeometryRef.current);
              }
            } else {
              showTemporaryMessage(
                `Update of ${type} '${geoName}' cancelled`
              );
              feature.setGeometry(originalGeometryRef.current);
            }
          } catch (error) {
            showTemporaryMessage("Error during update process");
            console.error("Error during update process:", error);
            feature.setGeometry(originalGeometryRef.current);
          } finally {
            cleanupGeometryUpdate();
          }
        });
        setShowConfirm(true);
      };

      const cleanupGeometryUpdate = () => {
        if (modifyRef.current) {
          map.removeInteraction(modifyRef.current);
          modifyRef.current = null;
        }
        removeGeometryUpdateMessage();
        setEditingFeature(null);
        originalGeometryRef.current = null;
        map.un("dblclick", handleModifyEnd);
        document.removeEventListener("keypress", handleKeyPress);
        setIsUpdating(false);
      };

      const handleKeyPress = (event) => {
        if (event.key === "Enter" && modifyRef.current) {
          handleModifyEnd();
        }
      };

      if (feature.getGeometry().getType() === "Point") {
        modify.once("modifyend", handleModifyEnd);
      } else {
        map.on("dblclick", handleModifyEnd);
      }

      document.addEventListener("keypress", handleKeyPress);

      return cleanupGeometryUpdate;
    },
    [map, showGeometryUpdateMessage, removeGeometryUpdateMessage, setPopupPosition, setIsUpdating, isGeometryChanged]
  );

  const showPopup = useCallback(
    (feature, coordinate) => {
      const geometryType = feature.getGeometry().getType();
      const geoName = feature.get("name");
  
      const lonLat = transform(coordinate, "EPSG:3857", "EPSG:4326");
      const lon = lonLat[0].toFixed(5);
      const lat = lonLat[1].toFixed(5);
  
      popupRef.current.innerHTML = `
        <div class="popup-content">
          <h3>${geoName}</h3>
          <p class="geometry-type">${geometryType}</p>
          <div class="coordinates">
            <span>Lon: ${lon}</span> <span>Lat: ${lat}</span>
          </div>
          <div class="popup-buttons">
            <button id="popup-name-update" class="popup-btn">Update Name</button>
            <button id="popup-geo-update" class="popup-btn">Update Geometry</button>
            <button id="popup-delete" class="popup-btn">Delete</button>
          </div>
        </div>
      `;
      
      const nameUpdateBtn = popupRef.current.querySelector("#popup-name-update");
      const geoUpdateBtn = popupRef.current.querySelector("#popup-geo-update");
      const deleteBtn = popupRef.current.querySelector("#popup-delete");
      
      nameUpdateBtn.addEventListener("click", () => {handleNameUpdate(feature)});
      geoUpdateBtn.addEventListener("click", () => handleGeometryUpdate(feature));
      deleteBtn.addEventListener("click", () => handleDelete(feature));
  
      const popupElement = overlayRef.current.getElement();
      popupElement.style.transform = `translate(-50%, -100%) translate(0px, -10px)`;
  
      setPopupPosition(coordinate);
    },
    [handleNameUpdate, handleGeometryUpdate, handleDelete, setPopupPosition]
  );

  useEffect(() => {
    if (!map) return;

    const handleMapClick = (event) => {
      if (modifyRef.current || editingFeature || isDrawing) return;

      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );

      if (feature) {
        event.stopPropagation();
        const coordinate = event.coordinate;
        showPopup(feature, coordinate);
      } else {
        setPopupPosition(undefined);
      }
    };

    map.on("click", handleMapClick);

    return () => {
      map.un("click", handleMapClick);
    };
  }, [map, showPopup, editingFeature, isDrawing, setPopupPosition]);

  return (
    <>
      <div ref={popupRef} className="ol-popup"></div>
      {showConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <p>{confirmMessage}</p>
            <button
              onClick={() => {
                confirmCallback(true);
                setShowConfirm(false);
              }}
            >
              Yes
            </button>
            <button
              onClick={() => {
                confirmCallback(false);
                setShowConfirm(false);
              }}
            >
              No
            </button>
          </div>
        </div>
      )}
      {showNameUpdate && (
        <div className="name-update-overlay">
          <div className="name-update-dialog">
            <p>{nameUpdateMessage}</p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={20}
            />
            <button
              onClick={() => {
                nameUpdateCallback({ value: newName, cancelled: false });
                setShowNameUpdate(false);
              }}
            >
              Update
            </button>
            <button
              onClick={() => {
                nameUpdateCallback({ cancelled: true });
                setShowNameUpdate(false);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Popup;