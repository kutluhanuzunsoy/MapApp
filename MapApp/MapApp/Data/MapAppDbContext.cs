using Microsoft.EntityFrameworkCore;
using MapApp.Entities;

namespace MapApp.Data
{
    public class MapAppDbContext : DbContext
    {
        public MapAppDbContext(DbContextOptions<MapAppDbContext> options) : base(options)
        {
        }

        public DbSet<CoordinateGeo> CoordinatesGeo { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<CoordinateGeo>(entity =>
            {
                entity.ToTable("coordinates_geo");

                entity.Property(e => e.Id)
                    .HasColumnName("id")
                    .HasColumnType("uuid");

                entity.Property(e => e.GeoLoc)
                    .HasColumnName("geoloc")
                    .HasColumnType("geometry");

                entity.Property(e => e.Name)
                    .HasColumnName("name")
                    .HasColumnType("text");
            });
        }
    }
}