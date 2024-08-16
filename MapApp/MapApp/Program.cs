using MapApp.Data;
using MapApp.Services;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace MapApp
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.Converters.Add(new GeometryConverter());
                });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAllOrigins",
                    builder =>
                    {
                        builder.AllowAnyOrigin()
                               .AllowAnyHeader()
                               .AllowAnyMethod();
                    });
            });

            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

            connectionString = connectionString
                .Replace("${DB_HOST}", Environment.GetEnvironmentVariable("DB_HOST"))
                .Replace("${DB_NAME}", Environment.GetEnvironmentVariable("DB_NAME"))
                .Replace("${DB_USERNAME}", Environment.GetEnvironmentVariable("DB_USERNAME"))
                .Replace("${DB_PASSWORD}", Environment.GetEnvironmentVariable("DB_PASSWORD"));

            builder.Services.AddDbContext<MapAppDbContext>(options =>
                options.UseNpgsql(connectionString, x => x.UseNetTopologySuite())
            );

            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
            builder.Services.AddScoped<ICoordinateService, CoordinateUnitOfWorkService>();

            var app = builder.Build();

            app.UseHttpsRedirection();

            app.UseAuthorization();

            app.MapControllers();

            app.UseCors("AllowAllOrigins");


            app.UseSwagger();
            app.UseSwaggerUI();
            

            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var context = services.GetRequiredService<MapAppDbContext>();
                context.Database.Migrate();
            }

            app.Run();
        }
    }
}