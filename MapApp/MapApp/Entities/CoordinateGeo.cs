using NetTopologySuite.Geometries;

namespace MapApp.Entities
{
    public class CoordinateGeo
    {
        public Guid Id { get; set; }
        public Geometry GeoLoc { get; set; }
        public string Name { get; set; }
    }
}