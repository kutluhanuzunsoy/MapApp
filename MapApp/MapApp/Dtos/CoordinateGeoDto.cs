using System.ComponentModel.DataAnnotations;

namespace MapApp.Dto
{
    public class CoordinateGeoDto
    {
        [Required]
        public string Wkt { get; set; }
        [Required]
        public string Name { get; set; }
    }
}
