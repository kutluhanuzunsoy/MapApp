import React, { useEffect, useRef, useState, useCallback } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { defaults } from "ol/interaction";
import { fromLonLat } from "ol/proj";
import WKT from "ol/format/WKT";
import DrawingLayer from "./DrawingLayer";
import Popup from "./Popup";
import DataTable from "./DataTable";
import WktModal from "./WktModal";
import { showTemporaryMessage } from "../utils/temporaryMessage";
import { updateGeometry } from "../services/api";
import "../styles/MapView.css";

function MapView({
  isDrawing,
  geometryType,
  isDataTableVisible,
  toggleDataTable,
  setIsUpdating,
}) {
  const mapRef = useRef();
  const [map, setMap] = useState(null);
  const [source, setSource] = useState(null);
  const [features, setFeatures] = useState([]);
  const [popupPosition, setPopupPosition] = useState(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(null);
  const [currentWkt, setCurrentWkt] = useState("");

  useEffect(() => {
    const initialMap = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: fromLonLat([35.2433, 38.9637]),
        zoom: 6.2,
      }),
      interactions: defaults({ doubleClickZoom: false }),
    });

    setMap(initialMap);

    return () => initialMap.setTarget(undefined);
  }, []);

  useEffect(() => {
    if (!map) return;

    const handlePointerMove = (e) => {
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    };

    map.on("pointermove", handlePointerMove);

    return () => {
      map.un("pointermove", handlePointerMove);
    };
  }, [map]);

  const updateFeatures = useCallback(() => {
    if (source) {
      setFeatures(source.getFeatures());
    }
  }, [source]);

  useEffect(() => {
    if (source) {
      updateFeatures();
      source.on("addfeature", updateFeatures);
      source.on("removefeature", updateFeatures);
      return () => {
        source.un("addfeature", updateFeatures);
        source.un("removefeature", updateFeatures);
      };
    }
  }, [source, updateFeatures]);

  const centerAndZoomToGeometry = useCallback(
    (geometry) => {
      const extent = geometry.getExtent();
      const view = map.getView();

      const thresholdZoom = 8;
      const currentZoom = view.getZoom();

      var maxZoom = Math.max(currentZoom, thresholdZoom);
      var duration = 1500;

      view.fit(extent, {
        padding: [50, 50, 50, 50],
        maxZoom: maxZoom,
        duration: duration,
      });
    },
    [map]
  );

  const updateGeometryWkt = useCallback(
    (feature) => {
      const wkt = new WKT().writeFeature(feature, {
        dataProjection: "EPSG:4326",
        featureProjection: map.getView().getProjection(),
      });
      setCurrentFeature(feature);
      setCurrentWkt(wkt);
      setIsModalOpen(true);
    },
    [map]
  );

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setCurrentFeature(null);
    setCurrentWkt("");
  }, []);

  const handleWktUpdate = useCallback(
    async (newWkt) => {
      const geometryType = currentFeature.getGeometry().getType();
      const geometryName = currentFeature.get("name");
  
      if (newWkt === currentWkt) {
        showTemporaryMessage(
          `Nothing changed in ${geometryType} '${geometryName}'`,
          1500
        );
        handleModalClose();
        return;
      }
  
      let newFeature;
      try {
        newFeature = new WKT().readFeature(newWkt, {
          dataProjection: "EPSG:4326",
          featureProjection: map.getView().getProjection(),
        });
      } catch (error) {
        console.error("Invalid WKT:", error);
        showTemporaryMessage("Invalid WKT format. Please try again.", 3000);
        handleModalClose();
        return; 
      }
  
      try {
        currentFeature.setGeometry(newFeature.getGeometry());
        const result = await updateGeometry(currentFeature, map);
        if (result.success) {
          centerAndZoomToGeometry(currentFeature.getGeometry());
          toggleDataTable();
          showTemporaryMessage(
            `${geometryType} '${geometryName}' updated successfully`
          );
        } else {
          throw new Error(result.error || "Update failed");
        }
      } catch (error) {
        console.error("Error updating geometry:", error);
        showTemporaryMessage(`Failed to update ${geometryType} '${geometryName}' - ${error.message}`);
        currentFeature.setGeometry(
          new WKT()
            .readFeature(currentWkt, {
              dataProjection: "EPSG:4326",
              featureProjection: map.getView().getProjection(),
            })
            .getGeometry()
        );
      }
      handleModalClose();
    },
    [currentFeature, currentWkt, map, centerAndZoomToGeometry, handleModalClose, toggleDataTable]
  );

  const deleteGeometry = useCallback(
    (feature) => {
      if (feature && source) {
        source.removeFeature(feature);
      }
    },
    [source]
  );

  const hidePopup = useCallback(() => {
    setPopupPosition(undefined);
  }, []);

  return (
    <div ref={mapRef} id="map">
      {map && (
        <>
          <DrawingLayer
            map={map}
            isDrawing={isDrawing}
            geometryType={geometryType}
            setSource={setSource}
            hidePopup={hidePopup}
          />
          <Popup
            map={map}
            source={source}
            isDrawing={isDrawing}
            popupPosition={popupPosition}
            setPopupPosition={setPopupPosition}
            setIsUpdating={setIsUpdating}
          />
          {isDataTableVisible && source && (
            <DataTable
              features={features}
              centerAndZoomToGeometry={centerAndZoomToGeometry}
              updateGeometryWkt={updateGeometryWkt}
              deleteGeometry={deleteGeometry}
              toggleDataTable={toggleDataTable}
              hidePopup={hidePopup}
            />
          )}
          <WktModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            currentWkt={currentWkt}
            onUpdate={handleWktUpdate}
          />
        </>
      )}
    </div>
  );
}

export default MapView;