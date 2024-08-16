import { Map, View } from "ol";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Draw from "ol/interaction/Draw";
import { fromLonLat } from "ol/proj";
import { Style, Fill, Stroke, Text, Circle as CircleStyle } from "ol/style";
import WKT from "ol/format/WKT";
import Overlay from "ol/Overlay";
import { Modify, defaults} from "ol/interaction";
import Collection from "ol/Collection";
import jQuery from 'jquery';
window.$ = window.jQuery = jQuery;
import 'datatables.net-select';
import 'datatables.net-buttons';
import 'datatables.net';

const API_URL = "http://localhost:5003/api/Coordinate";
const POLLING_INTERVAL = 2000;

let map, source, vector, draw;
let isDrawing = false, isUpdating = false, updateKeyListener = null;
let pollingIntervalId;
let popup, popupOverlay;
let overlay, overlayElement;
let dataTableVisible = false;

document.addEventListener("DOMContentLoaded", init);

function init() {
  initMap();
  setupEventListeners();
  addModifyInteraction();
  startPolling();
}

function initMap() {
  createVectorLayer();
  createMap();
  createPopupOverlay();
  createMapOverlay();
  setupMapEventListeners();
  fetchGeometries();
}

function createVectorLayer() {
  source = new VectorSource({ wrapX: false });
  vector = new VectorLayer({
    source: source,
    style: createStyle,
    updateWhileAnimating: true,
    updateWhileInteracting: true,
  });
}

function createMap() {
  map = new Map({
    target: "map",
    layers: [new TileLayer({ source: new OSM() }), vector],
    view: new View({
      center: fromLonLat([35.2433, 38.9637]),
      zoom: 6.2,
    }),
    interactions: defaults({
      doubleClickZoom: false,
    }),
  });
}

function createPopupOverlay() {
  popup = document.createElement("div");
  popup.className = "ol-popup";
  popupOverlay = new Overlay({
    element: popup,
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
  });
  map.addOverlay(popupOverlay);
}

function createMapOverlay() {
  overlayElement = document.createElement("div");
  overlayElement.className = "map-overlay";
  overlay = new Overlay({
    element: overlayElement,
    positioning: "top-left",
    stopEvent: false,
  });
  map.addOverlay(overlay);
}

function setupMapEventListeners() {
  map.on("click", handleMapClick);
  map.on("pointermove", handlePointerMove);
}

function handleMapClick(event) {
  if (!isDrawing) {
    const feature = map.forEachFeatureAtPixel(
      event.pixel,
      (feature) => feature
    );
    if (feature) {
      createPopup(feature, event.coordinate);
    } else {
      popupOverlay.setPosition(undefined);
    }
  }
}

function handlePointerMove(evt) {
  const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
  map.getTargetElement().style.cursor = feature ? "pointer" : "";
}

function createStyle(feature) {
  const geometryType = feature.getGeometry().getType();
  const geoName = feature.get("name");

  const style = new Style({
    stroke: new Stroke({ color: "rgba(0, 0, 255, 0.6)", width: 3 }),
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
        fill: new Fill({ color: "rgba(0, 0, 255, 0.6)" }),
        stroke: new Stroke({ color: "#fff", width: 1 }),
      })
    );
    style.getText().setOffsetY(-15);
  } else if (geometryType === "LineString") {
    style.getText().setPlacement("line");
    style.getText().setOffsetY(-8);
  }

  return style;
}

function createPopup(feature, coordinate) {
  const geometryType = feature.getGeometry().getType();
  const geoName = feature.get("name");

  const lonLat = ol.proj.transform(coordinate, "EPSG:3857", "EPSG:4326");
  const lon = lonLat[0].toFixed(5);
  const lat = lonLat[1].toFixed(5);

  popup.innerHTML = `
    <div class="popup-content">
      <h3>${geoName}</h3>
      <p class="geometry-type">${geometryType}</p>
      <div class="coordinates">
        <span>Lon: ${lon}</span> <span>Lat: ${lat}</span>
      </div>
      <div class="popup-buttons">
        <button id="popup-update" class="popup-btn">Update</button>
        <button id="popup-delete" class="popup-btn">Delete</button>
      </div>
    </div>
  `;

  setupPopupEventListeners(feature, geometryType);

  const popupOffset = [0, -10];
  popupOverlay.setPosition(coordinate);

  const popupElement = popupOverlay.getElement();
  popupElement.style.transform = `translate(-50%, -100%) translate(${popupOffset[0]}px, ${popupOffset[1]}px)`;
}

function setupPopupEventListeners(feature, geometryType) {
  document.getElementById("popup-delete").addEventListener("click", () => {
    if (confirm("Are you sure you want to delete this geometry?")) {
      deleteGeometry(feature);
      popupOverlay.setPosition(undefined);
    }
  });

  document.getElementById("popup-update").addEventListener("click", () => {
    popupOverlay.setPosition(undefined);
    if (geometryType === "Point") {
      enablePointDrag(feature);
    } else {
      enablePolygonLineStringUpdate(feature);
    }
  });
}

function enablePointDrag(feature) {
  isDrawing = true;
  isUpdating = true;
  const modify = new Modify({
    features: new Collection([feature]),
  });
  map.addInteraction(modify);

  showUpdateMessage(feature);

  const originalPosition = feature.getGeometry().getCoordinates();

  function handleModifyEnd() {
    confirmUpdate();
  }

  function handleEnterKey(event) {
    if (event.key === "Enter" && isUpdating) {
      confirmUpdate();
    }
  }

  function confirmUpdate() {
    if (confirm("Do you want to update the point's location?")) {
      updateGeometry(feature);
    } else {
      feature.getGeometry().setCoordinates(originalPosition);
    }
    cleanup();
  }

  modify.on("modifyend", handleModifyEnd);
  updateKeyListener = handleEnterKey;
  document.addEventListener("keydown", updateKeyListener);

  const addGeometryButton = document.getElementById("add-geometry-btn");
  const searchButton = document.getElementById("search-btn");
  const geometryTypeSelect = document.getElementById("geometry-type");

  addGeometryButton.disabled = true;
  searchButton.disabled = true;
  geometryTypeSelect.disabled = true;

  function cleanup() {
    map.removeInteraction(modify);
    removeUpdateMessage();
    document.removeEventListener("keydown", updateKeyListener);
    isDrawing = false;
    isUpdating = false;
    updateKeyListener = null;

    addGeometryButton.disabled = false;
    searchButton.disabled = false;
    geometryTypeSelect.disabled = false;
  }
}

function enablePolygonLineStringUpdate(feature) {
  isDrawing = true;
  isUpdating = true;
  const modify = new Modify({
    features: new Collection([feature]),
  });
  map.addInteraction(modify);

  showUpdateMessage(feature);

  const originalGeometry = feature.getGeometry().clone();

  function handleConfirm() {
    if (confirm("Do you want to update the geometry?")) {
      updateGeometry(feature);
    } else {
      feature.setGeometry(originalGeometry);
    }
    cleanup();
  }

  map.once("dblclick", handleConfirm);
  updateKeyListener = function (event) {
    if (event.key === "Enter" && isUpdating) {
      handleConfirm();
    }
  };
  document.addEventListener("keydown", updateKeyListener);

  const addGeometryButton = document.getElementById("add-geometry-btn");
  const searchButton = document.getElementById("search-btn");
  const geometryTypeSelect = document.getElementById("geometry-type");
  addGeometryButton.disabled = true;
  searchButton.disabled = true;
  geometryTypeSelect.disabled = true;

  function cleanup() {
    map.removeInteraction(modify);
    removeUpdateMessage();
    map.un("dblclick", handleConfirm);
    document.removeEventListener("keydown", updateKeyListener);
    isDrawing = false;
    isUpdating = false;
    updateKeyListener = null;

    addGeometryButton.disabled = false;
    searchButton.disabled = false;
    geometryTypeSelect.disabled = false;
  }
}

function showUpdateMessage(feature) {
  const messageElement = document.createElement("div");
  const type = feature.getGeometry().getType();
  const geoName = feature.get("name");

  messageElement.className = "map-message";
  messageElement.textContent = `Updating the ${type} "${geoName}". ${
    type === "Point" ? "Drop" : "Double-click"
  } or press "Enter" to confirm`;
  document.body.appendChild(messageElement);
}

function removeUpdateMessage() {
  const messageElement = document.querySelector(".map-message");
  if (messageElement) {
    document.body.removeChild(messageElement);
  }
}

function setupEventListeners() {
  document.getElementById("add-geometry-btn").addEventListener("click", toggleDrawing);
  document.getElementById("geometry-type").addEventListener("change", changeGeometryType);
  document.getElementById('search-btn').addEventListener('click', toggleDataTable);
}

function toggleDrawing() {
  const button = document.getElementById("add-geometry-btn");

  if (isDrawing) {
    stopDrawing();
    button.textContent = "Add Geometry";
  } else {
    startDrawing();
    button.textContent = "Stop Adding";
  }

  isDrawing = !isDrawing;
}

function startDrawing() {
  stopPolling();

  if (draw) {
    map.removeInteraction(draw);
  }

  const geometryType = document.getElementById("geometry-type").value;
  draw = new Draw({
    source: null,
    type: geometryType,
  });

  setupDrawEventListeners();

  map.addInteraction(draw);
}

function setupDrawEventListeners() {
  draw.on("drawstart", function (event) {
    event.feature.getGeometry().on("change", function () {
      if (!isDrawing) {
        draw.abortDrawing();
      }
    });
  });

  draw.on("drawend", function (event) {
    if (!isDrawing) {
      return;
    }

    const feature = event.feature;
    const name = prompt("Enter a name for this drawing:");
    if (name && name.trim()) {
      feature.setProperties({ name: name.trim() });
      source.addFeature(feature);
      saveGeometry(feature);
    } else {
      console.log("Drawing cancelled: No name provided");
      showTemporaryMessage("Drawing cancelled: No name provided");
    }
  });
}

function stopDrawing() {
  if (draw) {
    map.removeInteraction(draw);
    draw = null;
  }
  startPolling();
}

function changeGeometryType() {
  if (isDrawing) {
    stopDrawing();
    startDrawing();
  }
}

function centerAndZoomToGeometry(geometry, fromDataTable = false) {
  const extent = geometry.getExtent();
  const view = map.getView();

  const thresholdZoom = 6.2
  const currentZoom = view.getZoom();

  var maxZoom = Math.max(currentZoom, thresholdZoom);
  var duration = 1000;

  if (fromDataTable) {
    maxZoom = 10;
    duration = 1500;
  }

  view.fit(extent, {
    padding: [50, 50, 50, 50],
    maxZoom: maxZoom,
    duration: duration,
  });
}

async function saveGeometry(feature) {
  const wkt = new WKT().writeFeature(feature, {
    dataProjection: "EPSG:4326",
    featureProjection: map.getView().getProjection(),
  });

  try {
    const response = await fetch(`${API_URL}/AddCoordinate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Wkt: wkt, Name: feature.get("name") }),
    });

    const type = feature.getGeometry().getType();
    const geoName = feature.get("name");

    const result = await response.json();
    if (result.isSuccess) {
      feature.setId(result.data.id);
      centerAndZoomToGeometry(feature.getGeometry());
      showTemporaryMessage(type + ' "' + geoName + '" saved successfully');
      
      if ($.fn.DataTable.isDataTable('#data-table')) {
        updateDataTable();
      }
    } else {
      console.error("Failed to save geometry:", result.message);
      showTemporaryMessage("Failed to save " + type + ' "' + geoName + '"');
      source.removeFeature(feature);
    }
  } catch (error) {
    console.error("Error saving geometry:", error);
    showTemporaryMessage("Error saving geometry");
    source.removeFeature(feature);
  }
}

async function updateGeometry(feature) {
  const wkt = new WKT().writeFeature(feature, {
    dataProjection: "EPSG:4326",
    featureProjection: map.getView().getProjection(),
  });

  try {
    const response = await fetch(
      `${API_URL}/UpdateCoordinate/${feature.getId()}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Wkt: wkt, Name: feature.get("name") }),
      }
    );

    const result = await response.json();

    const type = feature.getGeometry().getType();
    const geoName = feature.get("name");

    if (result.isSuccess) {
      showTemporaryMessage(type + ' "' + geoName + '" updated successfully');
    } else {
      showTemporaryMessage("Failed to update " + type + ' "' + geoName + '"');
      console.error("Failed to update geometry:", result.message);
    }
  } catch (error) {
    showTemporaryMessage("Error updating " + type + ' "' + geoName + '"');
    console.error("Error updating geometry:", error);
  }
}

async function deleteGeometry(feature) {
  try {
    const response = await fetch(
      `${API_URL}/DeleteCoordinate/${feature.getId()}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    const type = feature.getGeometry().getType();
    const geoName = feature.get("name");

    if (result.isSuccess) {
      source.removeFeature(feature);
      if (dataTableVisible) {
        updateDataTable();
      }
      showTemporaryMessage(type + ' "' + geoName + '" deleted successfully');
    } else {
      showTemporaryMessage("Failed to delete " + type + ' "' + geoName + '"');
      console.error("Failed to delete geometry:", result.message);
    }
  } catch (error) {
    showTemporaryMessage("Error deleting" + type + ' "' + geoName + '"');
    console.error("Error deleting geometry:", error);
  }
}

async function fetchGeometries() {
  try {
    const response = await fetch(`${API_URL}/GetAllCoordinates`);
    if (!response.ok) throw new Error("Failed to fetch geometries");

    const result = await response.json();
    if (result.isSuccess && result.data) {
      const hasChanges = updateGeometries(result.data);
      if (hasChanges && dataTableVisible) {
        updateDataTable();
      }
      return hasChanges;
    }
    return false;
  } catch (error) {
    console.error("Error loading geometries:", error);
    return false;
  }
}

function updateGeometries(data) {
  const wktFormat = new WKT();
  const serverIds = new Set(data.map((coord) => coord.id));
  let hasChanges = false;

  data.forEach((coord) => {
    let feature = source.getFeatureById(coord.id);
    if (!feature) {
      feature = wktFormat.readFeature(coord.geoLoc, {
        dataProjection: "EPSG:4326",
        featureProjection: map.getView().getProjection(),
      });
      feature.setId(coord.id);
      source.addFeature(feature);
      hasChanges = true;
    }
    if (feature.get('name') !== coord.name) {
      feature.set('name', coord.name);
      hasChanges = true;
    }
  });

  source.getFeatures().forEach((feature) => {
    if (!serverIds.has(feature.getId())) {
      source.removeFeature(feature);
      hasChanges = true;
    }
  });

  return hasChanges;
}

function initDataTable() {
  if ($.fn.DataTable.isDataTable('#data-table')) {
    $('#data-table').DataTable().destroy();
  }

  $('#data-table').DataTable({
    columns: [
      { data: 'name', title: 'Name' },
      { data: 'geometryType', title: 'Geometry' },
      {
        data: null,
        title: 'Actions',
        render: function (data, type, row) {
          return '<button class="dt-btn dt-btn-zoom">Zoom</button> ' +
                 '<button class="dt-btn dt-btn-update">Update</button> ' +
                 '<button class="dt-btn dt-btn-delete">Delete</button>';
        }
      }
    ],
    dom: '<"top"f><"spacer"><"clear">rt<"bottom"ipl>',
    pageLength: 5,
    lengthMenu: [5, 10, 25, 50],
    scrollY: '300px',
    scrollCollapse: true,
    language: {
      search: "Filter:",
      searchPlaceholder: "Search...",
    },
    initComplete: function(settings, json) {
      $('.spacer').css('height', '10px'); 
      $('.bottom').css('padding-top', '20px');
      $('.top').css('padding-top', '60px');
    }
  });

  $('#data-table').on('click', '.dt-btn-zoom', function () {
    const data = $('#data-table').DataTable().row($(this).parents('tr')).data();
    const feature = source.getFeatureById(data.id);
    if (feature) {
      toggleDataTable();
      centerAndZoomToGeometry(feature.getGeometry(), true);
    }
  });

  $('#data-table').on('click', '.dt-btn-update', function () {
    const data = $('#data-table').DataTable().row($(this).parents('tr')).data();
    const feature = source.getFeatureById(data.id);
    if (feature) {
      updateGeometryWkt(feature);
    }
  });

  $('#data-table').on('click', '.dt-btn-delete', function () {
    const data = $('#data-table').DataTable().row($(this).parents('tr')).data();
    if (confirm(`Are you sure you want to delete ${data.name}?`)) {
      deleteGeometry(source.getFeatureById(data.id));
      $('#data-table').DataTable().row($(this).parents('tr')).remove().draw();
    }
  });
}

function updateGeometryWkt(feature) {
  const currentWkt = new WKT().writeFeature(feature, {
    dataProjection: "EPSG:4326",
    featureProjection: map.getView().getProjection(),
  });

  const modal = document.getElementById('wkt-modal');
  const textarea = document.getElementById('wkt-textarea');
  const updateBtn = document.getElementById('update-wkt-btn');
  const closeBtn = modal.querySelector('.close');

  textarea.value = currentWkt;
  modal.style.display = 'flex';

  function closeModal() {
    modal.style.display = 'none';
    document.removeEventListener('keydown', escapeHandler);
  }

  closeBtn.onclick = closeModal;

  updateBtn.onclick = function() {
    const newWkt = textarea.value.trim();
    if (newWkt !== "") {
      if (confirm("Are you sure you want to update this geometry?")) {
        try {
          const newFeature = new WKT().readFeature(newWkt, {
            dataProjection: "EPSG:4326",
            featureProjection: map.getView().getProjection(),
          });

          feature.setGeometry(newFeature.getGeometry());
          updateGeometry(feature);
          centerAndZoomToGeometry(feature.getGeometry());
          closeModal();
        } catch (error) {
          console.error("Invalid WKT:", error);
          showTemporaryMessage("Invalid WKT format. Please try again.");
        }
      }
    } else {
      showTemporaryMessage("WKT cannot be empty. Please enter a valid WKT.");
    }
  }

  window.onclick = function(event) {
    if (event.target == modal) {
      closeModal();
    }
  }

  function escapeHandler(event) {
    if (event.key === "Escape") {
      closeModal();
    }
  }
  document.addEventListener('keydown', escapeHandler);
}

function updateDataTable() {
  if (!$.fn.DataTable.isDataTable('#data-table')) {
    initDataTable();
  }

  const table = $('#data-table').DataTable();
  const currentPage = table.page();
  const currentOrder = table.order();
  const currentSearch = table.search();

  const tableData = source.getFeatures().map(feature => ({
    id: feature.getId(),
    name: feature.get('name'),
    geometryType: feature.getGeometry().getType()
  }));
  
  table.clear().rows.add(tableData).draw(false);

  table.page(currentPage).draw('page');
  table.order(currentOrder).draw();
  table.search(currentSearch).draw();

  if ($('#data-table-container').is(':visible')) {
    table.columns.adjust().draw();
  }
}

function toggleDataTable() {
  const container = document.getElementById('data-table-container');
  dataTableVisible = !dataTableVisible;
  container.style.display = dataTableVisible ? 'block' : 'none';
  
  if (dataTableVisible) {
    updateDataTable();
  }
}

function showTemporaryMessage(message) {
  const messageElement = document.createElement("div");
  messageElement.className = "temporary-message";
  messageElement.textContent = message;
  document.body.appendChild(messageElement);

  setTimeout(() => {
    document.body.removeChild(messageElement);
  }, 2000);
}

function addModifyInteraction() {
  const modifyInteraction = new ol.interaction.Modify({
    source: VectorSource,
    updateWhileAnimating: true,
    pixelTolerance: 10,
  });

  map.addInteraction(modifyInteraction);

  map.on("mousemove", function (e) {
    if (editing) {
      const overlay = new ol.Overlay({
        element: document.getElementById("overlay"),
        position: e.coordinate,
        positioning: "top-left",
        stopEvent: false,
      });
      map.addOverlay(overlay);
      overlay.setPosition(e.coordinate);
    }
  });
}

async function startPolling() {
  if (!pollingIntervalId) {
    const poll = async () => {
      await fetchGeometries();
      pollingIntervalId = setTimeout(poll, POLLING_INTERVAL);
    };
    await poll();
  }
}

function stopPolling() {
  if (pollingIntervalId) {
    clearTimeout(pollingIntervalId);
    pollingIntervalId = null;
  }
}