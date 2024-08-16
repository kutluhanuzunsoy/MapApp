using System.ComponentModel.DataAnnotations;

namespace MapApp.Dtos
{
    public record CoordinateDto
    {
        [Required]
        public double CoordinateX { get; set; }
        [Required]
        public double CoordinateY { get; set; }
        [Required]
        public string Name { get; set; }
    }
}