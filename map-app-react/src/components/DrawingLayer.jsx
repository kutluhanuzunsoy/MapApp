import { useEffect, useCallback, useState } from "react";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Draw } from "ol/interaction";
import { Style, Stroke, Fill, Text } from "ol/style";
import CircleStyle from "ol/style/Circle";
import { saveGeometry, fetchGeometries } from "../services/api";
import WKT from "ol/format/WKT";
import Modify from "ol/interaction/Modify";
import { showTemporaryMessage } from "../utils/temporaryMessage";

function DrawingLayer({ map, isDrawing, geometryType, setSource, hidePopup }) {
  const [source] = useState(() => new VectorSource());

  useEffect(() => {
    setSource(source);
  }, [source, setSource]);

  const updateGeometries = useCallback(
    (data) => {
      const wktFormat = new WKT();
      source.clear();

      data.forEach((coord) => {
        try {
          const feature = wktFormat.readFeature(coord.geoLoc, {
            dataProjection: "EPSG:4326",
            featureProjection: map.getView().getProjection(),
          });
          if (feature && feature.getGeometry()) {
            feature.setId(coord.id);
            feature.set("name", coord.name);
            source.addFeature(feature);
          } else {
            console.warn(`Invalid feature for coordinate: ${coord.id}`);
          }
        } catch (error) {
          console.error(`Error processing coordinate: ${coord.id}`, error);
        }
      });

      source.changed();
    },
    [source, map]
  );

  useEffect(() => {
    if (!map) return;

    const vector = new VectorLayer({ source, style: createStyle });
    map.addLayer(vector);

    const fetchAndUpdateGeometries = async () => {
      try {
        const result = await fetchGeometries();
        if (result.success) {
          updateGeometries(result.data);
        } else {
          showTemporaryMessage("Failed to fetch geometries");
          console.error("Failed to fetch geometries:", result.error);
        }
      } catch (error) {
        showTemporaryMessage("Error in fetchGeometries");
        console.error("Error in fetchGeometries:", error);
      }
    };

    fetchAndUpdateGeometries();

    return () => {
      map.removeLayer(vector);
    };
  }, [map, source, updateGeometries]);

  useEffect(() => {
    if (!map || !isDrawing) return;

    let drawingFeature = null;

    const draw = new Draw({
      type: geometryType,
      style: createStyle,
    });

    const saveFeature = async (feature) => {
      hidePopup();
      
      if (!feature || !feature.getGeometry()) {
        return false;
      }

      const result = await saveGeometry(feature, map);
      const geoName = feature.get("name");
      
      if (result.success) {
        showTemporaryMessage(
          `New ${geometryType} '${geoName}' added successfully`
        );
        feature.unset("isNewFeature");
      } else {
        showTemporaryMessage(`Failed to save ${geometryType} '${geoName}'`);
        source.removeFeature(feature);
        source.changed();
      }
      return result.success;
    };

    draw.on("drawstart", (event) => {
      drawingFeature = event.feature;
      drawingFeature.set("isNewFeature", true);
    });

    draw.on("drawend", async () => {
      if (!drawingFeature || !drawingFeature.getGeometry()) {
        showTemporaryMessage(`Failed to add ${geometryType}: Invalid geometry`);
        return;
      }

      const geometryName = prompt(`Enter a name for this ${geometryType}:`);
      if (geometryName === null) {
        showTemporaryMessage(`Canceled adding ${geometryType}`);
        drawingFeature.unset("isNewFeature");
        source.removeFeature(drawingFeature);
        source.changed();
        drawingFeature = null;
        return;
      }

      if (geometryName.trim() === "") {
        showTemporaryMessage(
          `Failed to add ${geometryType}: Name is required!`
        );
        drawingFeature.unset("isNewFeature");
        source.removeFeature(drawingFeature);
        source.changed();
        drawingFeature = null;
        return;
      }

      if (geometryName.length > 20) {
        showTemporaryMessage(
          `Failed to add ${geometryType}: Name must be 20 characters or less!`
        );
        drawingFeature.unset("isNewFeature");
        source.removeFeature(drawingFeature);
        source.changed();
        drawingFeature = null;
        return;
      }

      drawingFeature.set("name", geometryName.trim());
      source.addFeature(drawingFeature);

      if (geometryType !== "Point") {
        const modify = new Modify({ source });
        map.addInteraction(modify);

        const finishEditing = async () => {
          map.removeInteraction(modify);
          const success = await saveFeature(drawingFeature);
          if (!success) {
            source.removeFeature(drawingFeature);
            source.changed();
          }
          drawingFeature = null;
        };

        map.once("dblclick", finishEditing);
        document.addEventListener(
          "keypress",
          (e) => {
            if (e.key === "Enter") finishEditing();
          },
          { once: true }
        );
      } else {
        const success = await saveFeature(drawingFeature);
        if (!success) {
          source.removeFeature(drawingFeature);
          source.changed();
        }
        drawingFeature = null;
      }
    });

    map.addInteraction(draw);

    return () => {
      map.removeInteraction(draw);
      if (drawingFeature) {
        source.removeFeature(drawingFeature);
        source.changed();
      }
    };
  }, [map, isDrawing, geometryType, source, hidePopup]);

  return null;
}

const createStyle = (feature) => {
  if (!feature || !feature.getGeometry()) {
    return new Style();
  }

  const geometryType = feature.getGeometry().getType();
  const geoName = feature.get("name") || "";

  const style = new Style({
    stroke: new Stroke({ color: "rgba(0, 30, 210, 0.6)", width: 3 }),
    fill: new Fill({ color: "rgba(0, 0, 255, 0.1)" }),
    text: new Text({
      font: "14px Calibri,sans-serif",
      fill: new Fill({ color: "#000" }),
      stroke: new Stroke({ color: "#fff", width: 3 }),
      text: geoName,
      overflow: true,
    }),
  });

  if (geometryType === "Point") {
    style.setImage(
      new CircleStyle({
        radius: 6,
        fill: new Fill({ color: "rgba(0, 30, 210, 0.6)" }),
        stroke: new Stroke({ color: "#fff", width: 1 }),
      })
    );
    style.getText().setOffsetY(-15);
  } else if (geometryType === "LineString") {
    style.getText().setPlacement("line");
    style.getText().setOffsetY(-8);
  }

  return style;
};

export default DrawingLayer;