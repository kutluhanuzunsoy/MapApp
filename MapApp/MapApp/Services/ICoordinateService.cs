using MapApp.Dto;
using MapApp.Responses;

namespace MapApp.Services
{
    public interface ICoordinateService
    {
        Response GetAllCoordinates();
        Response GetCoordinateById(Guid id);
        Response AddCoordinate(CoordinateGeoDto coordinateCreateRequest);
        Response UpdateCoordinate(Guid id, CoordinateGeoDto coordinateUpdateRequest);
        Response DeleteCoordinate(Guid id);
    }
}