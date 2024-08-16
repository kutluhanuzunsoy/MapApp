# MapApp
MapApp is a full-stack application for managing and visualizing spatial data representing geographic features. It consists of a .NET 8 backend using Entity Framework Core with Npgsql for PostgreSQL connectivity, a React frontend, and a PostgreSQL database with PostGIS extension. The application uses OpenLayers for interactive map visualization and NetTopologySuite for geometry handling in the backend.

## Project Structure

- `MapApp/`: Backend application (.NET 8)
- `map-app-react/`: Frontend application (React)
- `map-app/`: Alternative frontend (Vanilla JavaScript)

## Features

- Add, update, and delete spatial data (points, linestrings, polygons) representing geographic features, using NetTopologySuite for backend processing and database integration
- Visualize data on an interactive map using OpenLayers
- Search and filter data using DataTables
- Zoom to specific geometries on the map

## Technologies Used

- Backend: .NET 8, Entity Framework Core, Npgsql, NetTopologySuite
- Frontend: React, JavaScript, HTML, CSS
- Database: PostgreSQL with PostGIS extension
- Map Visualization: OpenLayers
- Data Presentation: DataTables

## Prerequisites

- Docker and Docker Compose
- Git

## Building and Running the Application

1. Clone the repository:
```bash
git clone https://github.com/kutluhanuzunsoy/MapApp.git
```
```bash
cd MapApp
```
2. Update the `.env` file in the root directory with your specific values:
```bash
DB_HOST=db
DB_NAME=your_database_name
DB_USERNAME=your_username
DB_PASSWORD=your_password
REACT_APP_API_BASE_URL=http://localhost:5000
```
3. Build and run the Docker containers:
```bash
docker-compose up --build
```
4. Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Swagger UI: http://localhost:5000/swagger