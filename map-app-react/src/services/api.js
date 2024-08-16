import WKT from 'ol/format/WKT';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
const API_ENDPOINT = '/api/Coordinate';


export async function saveGeometry(feature, map) {
  if (!feature || !feature.getGeometry()) {
    console.error("Invalid feature: feature or geometry is null");
    return { success: false, error: "Invalid feature" };
  }

  try {
    const wkt = new WKT().writeFeature(feature, {
      dataProjection: "EPSG:4326",
      featureProjection: map.getView().getProjection(),
    });

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}/AddCoordinate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Wkt: wkt, Name: feature.get("name") || "" }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.isSuccess) {
      feature.setId(result.data.id);
      return { success: true, feature };
    } else {
      console.error("Failed to save geometry:", result.message);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Error saving geometry:", error);
    return { success: false, error: error.message };
  }
}

export async function updateGeometry(feature, map) {
  if (!feature || !feature.getGeometry()) {
    console.error("Invalid feature: feature or geometry is null");
    return { success: false, error: "Invalid feature" };
  }

  try {
    const wkt = new WKT().writeFeature(feature, {
      dataProjection: "EPSG:4326",
      featureProjection: map.getView().getProjection(),
    });

    const featureId = feature.getId();
    if (!featureId) {
      throw new Error("Feature ID is missing");
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINT}/UpdateCoordinate/${featureId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Wkt: wkt, Name: feature.get("name") || "" }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.isSuccess) {
      return { success: true };
    } else {
      console.error("Failed to update geometry:", result.message);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Error updating geometry:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteGeometry(feature) {
  if (!feature) {
    console.error("Invalid feature: feature is null");
    return { success: false, error: "Invalid feature" };
  }

  try {
    const featureId = feature.getId();
    if (!featureId) {
      throw new Error("Feature ID is missing");
    }

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINT}/DeleteCoordinate/${featureId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.isSuccess) {
      return { success: true };
    } else {
      console.error("Failed to delete geometry:", result.message);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("Error deleting geometry:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchGeometries() {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}/GetAllCoordinates`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.isSuccess && Array.isArray(result.data)) {
      return { success: true, data: result.data };
    }
    return { success: false, error: "No valid data received" };
  } catch (error) {
    console.error("Error loading geometries:", error);
    return { success: false, error: error.message };
  }
}