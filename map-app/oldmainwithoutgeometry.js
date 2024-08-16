//const API_URL = 'http://localhost:5003/api/Coordinates';

//const MapApp = {
//    vectorSource: null,
//    map: null,
//    popup: null,
//    addCoordinateMode: false,
//    pollingInterval: 3000,
//    isInitialized: false,

//    init() {
//        this.vectorSource = new ol.source.Vector();
//        this.initializeMap();
//        this.popup = this.createPopup();
//        if (!this.popup) {
//            console.error('Failed to create popup');
//        }
//        this.initializeEventListeners();
//        this.fetchCoordinates();
//        this.startPolling();
//        this.isInitialized = true;
//    },

//    initializeMap() {
//        const vectorLayer = new ol.layer.Vector({
//            source: this.vectorSource,
//            style: this.styleFunction
//        });

//        this.map = new ol.Map({
//            target: 'map',
//            layers: [
//                new ol.layer.Tile({ source: new ol.source.OSM() }),
//                vectorLayer
//            ],
//            view: new ol.View({
//                center: ol.proj.fromLonLat([35.2433, 38.9637]),
//                zoom: 6.5
//            })
//        });
//    },

//    styleFunction(feature) {
//        const isCircle = feature.get('type') === 'circle';
//        return new ol.style.Style({
//            image: new ol.style.Circle({
//                radius: 6,
//                fill: new ol.style.Fill({ color: 'red' }),
//                stroke: new ol.style.Stroke({ color: 'white', width: 2 })
//            }),
//            text: new ol.style.Text({
//                text: feature.get('name'),
//                font: '12px Calibri,sans-serif',
//                fill: new ol.style.Fill({ color: '#000' }),
//                stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
//                offsetY: -15
//            })
//        });
//    },

//    createPopup() {
//        const element = document.createElement('div');
//        element.className = 'ol-popup';
//        element.innerHTML = '<a href="#" id="popup-closer" class="ol-popup-closer"></a><div id="popup-content"></div>';

//        element.addEventListener('click', (e) => e.stopPropagation());

//        const popup = new ol.Overlay({
//            element: element,
//            positioning: 'center-left',
//            stopEvent: false,
//            offset: [10, 0] // Reset offset to [0, 0]
//        });

//        const closer = element.querySelector('.ol-popup-closer');
//        closer.onclick = (e) => {
//            e.preventDefault();
//            popup.setPosition(undefined);
//            closer.blur();
//            return false;
//        };

//        this.map.addOverlay(popup);
//        return popup;
//    },

//    initializeEventListeners() {
//        const addCoordinateBtn = document.getElementById('add-coordinate-btn');
//        addCoordinateBtn.addEventListener('click', () => this.toggleAddCoordinateMode());
//        this.map.getViewport().addEventListener('contextmenu', (e) => this.handleContextMenu(e));
//        this.map.on('click', (e) => this.handleMapClick(e));
//    },

//    toggleAddCoordinateMode() {
//        this.addCoordinateMode = !this.addCoordinateMode;
//        const addCoordinateBtn = document.getElementById('add-coordinate-btn');
//        if (this.addCoordinateMode) {
//            this.map.getViewport().style.cursor = 'crosshair';
//            addCoordinateBtn.classList.add('active');
//        } else {
//            this.map.getViewport().style.cursor = 'default';
//            addCoordinateBtn.classList.remove('active');
//        }
//    },

//    handleMapClick(evt) {
//        const clickedOnPopup = evt.originalEvent.target.closest('.ol-popup');
//        if (clickedOnPopup) {
//            return;
//        }

//        if (this.addCoordinateMode) {
//            this.handleAddCoordinate(evt);
//        } else {
//            const feature = this.map.forEachFeatureAtPixel(evt.pixel, feature => feature);
//            if (feature) {
//                const coordinate = feature.getGeometry().getCoordinates();
//                const lonLat = ol.proj.toLonLat(coordinate);
//                this.showPopup(feature, coordinate, lonLat);
//            } else {
//                this.popup.setPosition(undefined);
//            }
//        }
//    },

//    handleAddCoordinate(evt) {
//        // Change cursor back to default immediately
//        this.map.getViewport().style.cursor = 'default';
//        this.toggleAddCoordinateMode();

//        const coordinate = evt.coordinate;
//        const lonLat = ol.proj.toLonLat(coordinate);

//        // Use a timeout to show the prompt after a short delay
//        setTimeout(() => {
//            const name = prompt("Enter a name for this point:");
//            if (name) {
//                this.addCoordinate(lonLat[0], lonLat[1], name);
//            }
//        }, 100); // Delay of 100 milliseconds
//    },

//    async addCoordinate(x, y, name) {
//        try {
//            const response = await fetch(`${API_URL}/AddCoordinate`, {
//                method: 'POST',
//                headers: { 'Content-Type': 'application/json' },
//                body: JSON.stringify({ coordinateX: x, coordinateY: y, name: name }),
//            });
//            const data = await response.json();
//            if (data.isSuccess) {
//                const feature = this.addPoint(x, y, name, data.data.id, false);
//                setTimeout(() => this.centerAndZoom([x, y]), 100);
//            } else {
//                console.error('Failed to add coordinate:', data);
//            }
//        } catch (error) {
//            console.error('Error adding coordinate:', error);
//        }
//    },

//    addPoint(x, y, name, id, shouldZoom = true) {
//        const coordinate = [x, y];
//        const feature = new ol.Feature({
//            geometry: new ol.geom.Point(ol.proj.fromLonLat(coordinate)),
//            name: name,
//            id: id,
//            type: 'circle'
//        });
//        this.vectorSource.addFeature(feature);
//        if (shouldZoom) {
//            this.centerAndZoom(coordinate);
//        }
//        return feature;
//    },

//    async fetchCoordinates() {
//        try {
//            const response = await fetch(`${API_URL}/GetAllCoordinates`);
//            const data = await response.json();
//            if (data.isSuccess && Array.isArray(data.data)) {
//                this.updateFeatures(data.data);
//            } else {
//                console.error('Invalid data format:', data);
//            }
//        } catch (error) {
//            console.error('Error fetching coordinates:', error);
//        }
//    },

//    updateFeatures(coordinates) {
//        const existingFeatures = this.vectorSource.getFeatures();
//        const existingIds = new Set(existingFeatures.map(f => f.get('id')));
//        const newIds = new Set(coordinates.map(coord => coord.id));

//        existingFeatures.forEach(feature => {
//            if (!newIds.has(feature.get('id'))) {
//                this.vectorSource.removeFeature(feature);
//            }
//        });

//        coordinates.forEach(coord => {
//            if (!existingIds.has(coord.id)) {
//                this.addPoint(coord.coordinateX, coord.coordinateY, coord.name, coord.id, false);
//            } else {
//                const feature = existingFeatures.find(f => f.get('id') === coord.id);
//                if (feature) {
//                    feature.set('name', coord.name);
//                    feature.getGeometry().setCoordinates(ol.proj.fromLonLat([coord.coordinateX, coord.coordinateY]));
//                }
//            }
//        });
//    },

//    async updateCoordinate(id, newName, newX, newY, shouldZoom = true) {
//        try {
//            const response = await fetch(`${API_URL}/UpdateCoordinate/${id}`, {
//                method: 'PUT',
//                headers: { 'Content-Type': 'application/json' },
//                body: JSON.stringify({
//                    name: newName,
//                    coordinateX: newX,
//                    coordinateY: newY
//                }),
//            });
//            const data = await response.json();
//            if (data.isSuccess) {
//                console.log('Coordinate updated successfully');
//                const feature = this.vectorSource.getFeatures().find(f => f.get('id') === id);
//                if (feature) {
//                    feature.set('name', newName);
//                    feature.getGeometry().setCoordinates(ol.proj.fromLonLat([newX, newY]));
//                    this.map.render();

//                    if (shouldZoom) {
//                        this.centerAndZoom([newX, newY]);
//                    }
//                }
//                this.popup.setPosition(undefined);
//            } else {
//                console.error('Failed to update coordinate:', data);
//            }
//        } catch (error) {
//            console.error('Error updating coordinate:', error);
//        }
//    },

//    async deleteCoordinate(id) {
//        try {
//            const response = await fetch(`${API_URL}/DeleteCoordinate/${id}`, { method: 'DELETE' });
//            const data = await response.json();
//            return data.isSuccess;
//        } catch (error) {
//            console.error('Error deleting coordinate:', error);
//            return false;
//        }
//    },

//    handleContextMenu(e) {
//        e.preventDefault();
//    },

//    showPopup(feature, coordinate, lonLat) {
//        const content = document.getElementById('popup-content');
//        content.innerHTML = `
//        <div class="coordinate-info">
//            <h3 class="coordinate-name">${feature.get('name')}</h3>
//            <p class="coordinate-location">
//                x: ${lonLat[0].toFixed(6)}, y: ${lonLat[1].toFixed(6)}
//            </p>
//            <input type="text" id="new-name-input" placeholder="Enter new name" value="${feature.get('name')}">
//            <input type="number" id="new-x-input" placeholder="Enter new X coordinate" value="${lonLat[0].toFixed(6)}" step="0.000001">
//            <input type="number" id="new-y-input" placeholder="Enter new Y coordinate" value="${lonLat[1].toFixed(6)}" step="0.000001">
//            <div class="button-container">
//                <button id="update-btn">Update</button>
//                <button id="delete-btn">Delete</button>
//            </div>
//        </div>
//    `;

//        const updateButton = document.getElementById('update-btn');
//        const deleteButton = document.getElementById('delete-btn');

//        updateButton.onclick = (e) => {
//            e.preventDefault();
//            e.stopPropagation();
//            const newName = document.getElementById('new-name-input').value;
//            const newX = parseFloat(document.getElementById('new-x-input').value);
//            const newY = parseFloat(document.getElementById('new-y-input').value);
//            if (newName.trim() !== '' && !isNaN(newX) && !isNaN(newY)) {
//                this.updateCoordinate(feature.get('id'), newName, newX, newY);
//            }
//        };

//        deleteButton.onclick = async (e) => {
//            e.preventDefault();
//            e.stopPropagation();
//            const id = feature.get('id');
//            const deleted = await this.deleteCoordinate(id);
//            if (deleted) {
//                this.vectorSource.removeFeature(feature);
//                this.popup.setPosition(undefined);
//                this.map.render();
//            }
//        };

//        this.popup.setPosition(coordinate);

//        this.popup.setPosition(coordinate);

//        const textStyle = feature.getStyle().getText();
//        const textSize = this.map.getVectorContext().measureTextExtent(textStyle.getText());
//        const popupOffset = [10, -textSize.height / 2];
//        this.popup.setPosition([coordinate[0] + popupOffset[0], coordinate[1] + popupOffset[1]]);
//    },

//    centerAndZoom(coordinate) {
//        const view = this.map.getView();
//        const currentZoom = view.getZoom();
//        const targetZoom = 15;

//        const newCenter = ol.proj.fromLonLat(coordinate);

//        if (currentZoom < targetZoom) {
//            view.animate({
//                center: newCenter,
//                zoom: targetZoom,
//                duration: 1000
//            });
//        } else {
//            view.animate({
//                center: newCenter,
//                duration: 1000
//            });
//        }
//    },

//    fitView() {
//        const extent = this.vectorSource.getExtent();
//        if (!ol.extent.isEmpty(extent)) {
//            this.map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 10 });
//        }
//    },

//    startPolling() {
//        setInterval(() => this.fetchCoordinates(), this.pollingInterval);
//    }
//};

//MapApp.init();





//const API_URL = 'http://localhost:5003/api/Coordinates';
//const POLLING_INTERVAL = 5000; // 5 seconds

//let vectorDataSource;
//let mapInstance;
//let popupOverlay;
//let isAddingCoordinate = false;

//function setupMap() {
//    vectorDataSource = new ol.source.Vector();
//    createMapInstance();
//    popupOverlay = initializePopup();
//    addEventHandlers();
//    fetchCoordinatesFromServer();
//    startPollingForUpdates();
//}

//function createMapInstance() {
//    const vectorLayer = new ol.layer.Vector({
//        source: vectorDataSource,
//        style: defineFeatureStyle
//    });

//    mapInstance = new ol.Map({
//        target: 'map',
//        layers: [
//            new ol.layer.Tile({ source: new ol.source.OSM() }),
//            vectorLayer
//        ],
//        view: new ol.View({
//            center: ol.proj.fromLonLat([35.2433, 38.9637]),
//            zoom: 6.5
//        })
//    });
//}

//function defineFeatureStyle(feature) {
//    const isCircle = feature.get('type') === 'circle';
//    return new ol.style.Style({
//        image: new ol.style.Circle({
//            radius: 6,
//            fill: new ol.style.Fill({ color: isCircle ? 'blue' : 'red' }),
//            stroke: new ol.style.Stroke({ color: 'white', width: 2 })
//        }),
//        text: new ol.style.Text({
//            text: feature.get('name'),
//            font: '12px Calibri,sans-serif',
//            fill: new ol.style.Fill({ color: '#000' }),
//            stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
//            offsetY: -15
//        })
//    });
//}

//function initializePopup() {
//    const popupElement = document.createElement('div');
//    popupElement.className = 'ol-popup';
//    popupElement.innerHTML = '<a href="#" id="popup-closer" class="ol-popup-closer"></a><div id="popup-content"></div>';

//    const popup = new ol.Overlay({
//        element: popupElement,
//        positioning: 'bottom-center',
//        stopEvent: false,
//        offset: [0, -10]
//    });

//    mapInstance.addOverlay(popup);
//    return popup;
//}

//function addEventHandlers() {
//    const addCoordinateBtn = document.getElementById('add-coordinate-btn');
//    addCoordinateBtn.addEventListener('click', toggleAddCoordinateMode);
//    mapInstance.getViewport().addEventListener('contextmenu', handleContextMenu);
//    mapInstance.on('click', handleMapClick);
//}

//function toggleAddCoordinateMode() {
//    isAddingCoordinate = !isAddingCoordinate;
//    const addCoordinateBtn = document.getElementById('add-coordinate-btn');
//    if (isAddingCoordinate) {
//        mapInstance.getViewport().style.cursor = 'crosshair';
//        addCoordinateBtn.classList.add('active');
//    } else {
//        mapInstance.getViewport().style.cursor = 'default';
//        addCoordinateBtn.classList.remove('active');
//    }
//}

//function handleAddCoordinate(evt) {
//    if (isAddingCoordinate) {
//        const coordinate = evt.coordinate;
//        const lonLat = ol.proj.toLonLat(coordinate);
//        const name = prompt("Enter a name for this point:");
//        if (name) {
//            createCircleFeature(lonLat[0], lonLat[1], name);
//            addCoordinateToServer(lonLat[0], lonLat[1], name);
//            toggleAddCoordinateMode();
//        }
//    }
//}

//function createCircleFeature(x, y, name) {
//    const feature = new ol.Feature({
//        geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y])),
//        name: name,
//        type: 'circle'
//    });
//    vectorDataSource.addFeature(feature);
//}

//async function fetchCoordinatesFromServer() {
//    try {
//        const response = await fetch(`${API_URL}/GetAllCoordinates`);
//        const data = await response.json();
//        if (data.isSuccess && Array.isArray(data.data)) {
//            updateMapFeatures(data.data);
//        } else {
//            console.error('Invalid data format:', data);
//        }
//    } catch (error) {
//        console.error('Error fetching coordinates:', error);
//    }
//}

//function updateMapFeatures(coordinates) {
//    const existingFeatures = vectorDataSource.getFeatures();
//    const existingIds = new Set(existingFeatures.map(f => f.get('id')));
//    const newIds = new Set(coordinates.map(coord => coord.id));

//    existingFeatures.forEach(feature => {
//        if (!newIds.has(feature.get('id'))) {
//            vectorDataSource.removeFeature(feature);
//        }
//    });

//    coordinates.forEach(coord => {
//        if (!existingIds.has(coord.id)) {
//            addPointFeature(coord.coordinateX, coord.coordinateY, coord.name, coord.id);
//        }
//    });

//    fitMapViewToFeatures();
//}

//function addPointFeature(x, y, name, id) {
//    const feature = new ol.Feature({
//        geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y])),
//        name: name,
//        id: id
//    });
//    vectorDataSource.addFeature(feature);
//    fitMapViewToFeatures();
//}

//async function addCoordinateToServer(x, y, name) {
//    try {
//        const response = await fetch(`${API_URL}/AddCoordinate`, {
//            method: 'POST',
//            headers: { 'Content-Type': 'application/json' },
//            body: JSON.stringify({ coordinateX: x, coordinateY: y, name: name }),
//        });
//        const data = await response.json();
//        if (data.isSuccess) {
//            addPointFeature(x, y, name, data.data.id);
//        } else {
//            console.error('Failed to add coordinate:', data);
//        }
//    } catch (error) {
//        console.error('Error adding coordinate:', error);
//    }
//}

//async function deleteCoordinateFromServer(id) {
//    try {
//        const response = await fetch(`${API_URL}/DeleteCoordinate/${id}`, { method: 'DELETE' });
//        const data = await response.json();
//        return data.isSuccess;
//    } catch (error) {
//        console.error('Error deleting coordinate:', error);
//        return false;
//    }
//}

//function handleContextMenu(e) {
//    e.preventDefault();
//}

//function handleMapClick(evt) {
//    if (isAddingCoordinate) {
//        handleAddCoordinate(evt);
//    } else {
//        const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, feature => feature);

//        if (feature) {
//            const coordinate = feature.getGeometry().getCoordinates();
//            const lonLat = ol.proj.toLonLat(coordinate);
//            popupOverlay.setPosition(coordinate);
//            const content = document.getElementById('popup-content');
//            content.innerHTML = `
//                <div class="coordinate-name">${feature.get('name')}</div>
//                <div class="coordinate-info">
//                    x: ${lonLat[1].toFixed(6)}, y: ${lonLat[0].toFixed(6)}
//                </div>
//                <button id="delete-btn">Delete</button>
//            `;

//            document.getElementById('delete-btn').addEventListener('click', async () => {
//                const id = feature.get('id');
//                const deleted = await deleteCoordinateFromServer(id);
//                if (deleted) {
//                    vectorDataSource.removeFeature(feature);
//                    popupOverlay.setPosition(undefined);
//                    mapInstance.render();
//                }
//            });
//        } else {
//            popupOverlay.setPosition(undefined);
//        }
//    }
//}

//function fitMapViewToFeatures() {
//    const extent = vectorDataSource.getExtent();
//    mapInstance.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 10 });
//}

//function centerAndZoomToCoordinate(coordinate) {
//    mapInstance.getView().animate({
//        center: coordinate,
//        zoom: 10,
//        duration: 1000
//    });
//}

//function startPollingForUpdates() {
//    setInterval(() => fetchCoordinatesFromServer(), POLLING_INTERVAL);
//}

//setupMap();












//const API_URL = 'http://localhost:5003/api/Coordinates';

//const MapApp = {
//    vectorSource: null,
//    map: null,
//    popup: null,
//    addCoordinateMode: false,
//    pollingInterval: 4000,

//    init() {
//        this.vectorSource = new ol.source.Vector();
//        this.initializeMap();
//        this.popup = this.createPopup();
//        this.initializeEventListeners();
//        this.fetchCoordinates();
//        this.startPolling();
//    },

//    initializeMap() {
//        const vectorLayer = new ol.layer.Vector({
//            source: this.vectorSource,
//            style: this.styleFunction
//        });

//        this.map = new ol.Map({
//            target: 'map',
//            layers: [
//                new ol.layer.Tile({ source: new ol.source.OSM() }),
//                vectorLayer
//            ],
//            view: new ol.View({
//                center: ol.proj.fromLonLat([35.2433, 38.9637]),
//                zoom: 6.5
//            })
//        });
//    },

//    styleFunction(feature) {
//        const isCircle = feature.get('type') === 'circle';
//        return new ol.style.Style({
//            image: new ol.style.Circle({
//                radius: 6,
//                fill: new ol.style.Fill({ color: isCircle ? 'blue' : 'red' }),
//                stroke: new ol.style.Stroke({ color: 'white', width: 2 })
//            }),
//            text: new ol.style.Text({
//                text: feature.get('name'),
//                font: '12px Calibri,sans-serif',
//                fill: new ol.style.Fill({ color: '#000' }),
//                stroke: new ol.style.Stroke({ color: '#fff', width: 3 }),
//                offsetY: -15
//            })
//        });
//    },

//    createPopup() {
//        const element = document.createElement('div');
//        element.className = 'ol-popup';
//        element.innerHTML = '<a href="#" id="popup-closer" class="ol-popup-closer"></a><div id="popup-content"></div>';

//        const popup = new ol.Overlay({
//            element: element,
//            positioning: 'bottom-center',
//            stopEvent: false,
//            offset: [0, -10]
//        });

//        this.map.addOverlay(popup);
//        return popup;
//    },

//    initializeEventListeners() {
//        const addCoordinateBtn = document.getElementById('add-coordinate-btn');
//        addCoordinateBtn.addEventListener('click', () => this.toggleAddCoordinateMode());
//        this.map.getViewport().addEventListener('contextmenu', (e) => this.handleContextMenu(e));
//        this.map.on('click', (e) => this.handleMapClick(e));
//    },

//    toggleAddCoordinateMode() {
//        this.addCoordinateMode = !this.addCoordinateMode;
//        const addCoordinateBtn = document.getElementById('add-coordinate-btn');
//        if (this.addCoordinateMode) {
//            this.map.getViewport().style.cursor = 'crosshair';
//            addCoordinateBtn.classList.add('active');
//        } else {
//            this.map.getViewport().style.cursor = 'default';
//            addCoordinateBtn.classList.remove('active');
//        }
//    },

//    handleAddCoordinate(evt) {
//        if (this.addCoordinateMode) {
//            const coordinate = evt.coordinate;
//            const lonLat = ol.proj.toLonLat(coordinate);
//            const name = prompt("Enter a name for this point:");
//            if (name) {
//                this.addCircle(lonLat[0], lonLat[1], name);
//                this.addCoordinate(lonLat[0], lonLat[1], name);

//                this.toggleAddCoordinateMode();
//            }
//        }
//    },

//    addCircle(x, y, name) {
//        const feature = new ol.Feature({
//            geometry: new ol.geom.Point(ol.proj.fromLonLat([x, y])),
//            name: name,
//            type: 'circle'
//        });
//        this.vectorSource.addFeature(feature);
//    },

//    async fetchCoordinates() {
//        try {
//            const response = await fetch(`${API_URL}/GetAllCoordinates`);
//            const data = await response.json();
//            if (data.isSuccess && Array.isArray(data.data)) {
//                this.updateFeatures(data.data);
//            } else {
//                console.error('Invalid data format:', data);
//            }
//        } catch (error) {
//            console.error('Error fetching coordinates:', error);
//        }
//    },

//    updateFeatures(coordinates) {
//        const existingFeatures = this.vectorSource.getFeatures();
//        const existingIds = new Set(existingFeatures.map(f => f.get('id')));
//        const newIds = new Set(coordinates.map(coord => coord.id));

//        existingFeatures.forEach(feature => {
//            if (!newIds.has(feature.get('id'))) {
//                this.vectorSource.removeFeature(feature);
//            }
//        });

//        coordinates.forEach(coord => {
//            if (!existingIds.has(coord.id)) {
//                this.addPoint(coord.coordinateX, coord.coordinateY, coord.name, coord.id);
//            } else {
//                const feature = existingFeatures.find(f => f.get('id') === coord.id);
//                if (feature) {
//                    feature.set('name', coord.name);
//                    feature.getGeometry().setCoordinates(ol.proj.fromLonLat([coord.coordinateX, coord.coordinateY]));
//                }
//            }
//        });
//    },

//    addPoint(x, y, name, id) {
//        const coordinate = [x, y];
//        const feature = new ol.Feature({
//            geometry: new ol.geom.Point(ol.proj.fromLonLat(coordinate)),
//            name: name,
//            id: id
//        });
//        this.vectorSource.addFeature(feature);
//        this.centerAndZoom(coordinate); // Center and zoom to the new point
//    },

//    async addCoordinate(x, y, name) {
//        try {
//            const response = await fetch(`${API_URL}/AddCoordinate`, {
//                method: 'POST',
//                headers: { 'Content-Type': 'application/json' },
//                body: JSON.stringify({ coordinateX: x, coordinateY: y, name: name }),
//            });
//            const data = await response.json();
//            if (data.isSuccess) {
//                this.addPoint(x, y, name, data.data.id);
//            } else {
//                console.error('Failed to add coordinate:', data);
//            }
//        } catch (error) {
//            console.error('Error adding coordinate:', error);
//        }
//    },

//    async deleteCoordinate(id) {
//        try {
//            const response = await fetch(`${API_URL}/DeleteCoordinate/${id}`, { method: 'DELETE' });
//            const data = await response.json();
//            return data.isSuccess;
//        } catch (error) {
//            console.error('Error deleting coordinate:', error);
//            return false;
//        }
//    },

//    handleContextMenu(e) {
//        e.preventDefault();
//    },

//    handleMapClick(evt) {
//        if (this.addCoordinateMode) {
//            this.handleAddCoordinate(evt);
//        } else {
//            const feature = this.map.forEachFeatureAtPixel(evt.pixel, feature => feature);

//            if (feature) {
//                const coordinate = feature.getGeometry().getCoordinates();
//                const lonLat = ol.proj.toLonLat(coordinate);
//                this.popup.setPosition(coordinate);
//                const content = document.getElementById('popup-content');
//                content.innerHTML = `
//                    <div class="coordinate-name">${feature.get('name')}</div>
//                    <div class="coordinate-info">
//                        x: ${lonLat[1].toFixed(6)}, y: ${lonLat[0].toFixed(6)}
//                    </div>
//                    <button id="delete-btn">Delete</button>
//                `;

//                document.getElementById('delete-btn').addEventListener('click', async () => {
//                    const id = feature.get('id');
//                    const deleted = await this.deleteCoordinate(id);
//                    if (deleted) {
//                        this.vectorSource.removeFeature(feature);
//                        this.popup.setPosition(undefined);
//                        this.map.render();
//                    }
//                });
//            } else {
//                this.popup.setPosition(undefined);
//            }
//        }
//    },

//    centerAndZoom(coordinate) {
//        const view = this.map.getView();
//        const currentZoom = view.getZoom();
//        const targetZoom = 10;

//        const newCenter = ol.proj.fromLonLat(coordinate);

//        if (currentZoom < targetZoom) {
//            view.animate({
//                center: newCenter,
//                zoom: targetZoom,
//                duration: 1000
//            });
//        } else {
//            view.animate({
//                center: newCenter,
//                duration: 1000
//            });
//        }
//    },

//    fitView() {
//        const extent = this.vectorSource.getExtent();
//        if (!ol.extent.isEmpty(extent)) {
//            this.map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 10 });
//        }
//    },

//    startPolling() {
//        setInterval(() => this.fetchCoordinates(), this.pollingInterval);
//    }
//};

//MapApp.init();