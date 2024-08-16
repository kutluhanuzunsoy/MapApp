using MapApp.Services;
using MapApp.Responses;
using Microsoft.AspNetCore.Mvc;
using MapApp.Dto;

namespace MapApp.Controllers
{
    [ApiController]
    [Route("api/[controller]/[action]")]
    public class CoordinateController : ControllerBase
    {
        private readonly ICoordinateService coordinateService;

        public CoordinateController(ICoordinateService coordinateService)
        {
            this.coordinateService = coordinateService;
        }

        [HttpGet]
        public Response GetAllCoordinates()
        {
            return coordinateService.GetAllCoordinates();
        }

        [HttpGet("{id}")]
        public Response GetCoordinateById(Guid id)
        {
            return coordinateService.GetCoordinateById(id);
        }

        [HttpPost]
        public Response AddCoordinate(CoordinateGeoDto coordinateCreateRequest)
        {
            return coordinateService.AddCoordinate(coordinateCreateRequest);
        }

        [HttpPut("{id}")]
        public Response UpdateCoordinate(Guid id, CoordinateGeoDto coordinateUpdateRequest)
        {
            return coordinateService.UpdateCoordinate(id, coordinateUpdateRequest);
        }

        [HttpDelete("{id}")]
        public Response DeleteCoordinate(Guid id)
        {
            return coordinateService.DeleteCoordinate(id);
            
        }
    }
}