using MapApp.Data;
using MapApp.Dto;
using MapApp.Entities;
using MapApp.Repositories;
using MapApp.Responses;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.IO;

namespace MapApp.Services
{
    public class CoordinateUnitOfWorkService : ICoordinateService
    {
        private readonly IUnitOfWork unitOfWork;
        private readonly IRepository<CoordinateGeo> coordinateRepository;

        public CoordinateUnitOfWorkService(IUnitOfWork unitOfWork)
        {
            this.unitOfWork = unitOfWork;
            coordinateRepository = unitOfWork.GetRepository<CoordinateGeo>();
        }

        public Response GetAllCoordinates()
        {
            return ExecuteOperation(() =>
            {
                var coordinates = coordinateRepository.GetAll().ToList();

                return new Response
                {
                    Data = coordinates,
                    IsSuccess = true,
                    Message = $"{coordinates.Count} coordinates found."
                };
            });
        }

        public Response GetCoordinateById(Guid id)
        {
            return ExecuteOperation(() =>
            {
                var coordinate = coordinateRepository.GetById(id);
                if (coordinate == null)
                {
                    return new Response { Message = $"Coordinate with id {id} not found." };
                }

                return new Response
                {
                    Data = coordinate,
                    IsSuccess = true,
                    Message = $"Coordinate with id {id} found."
                };
            });
        }

        public Response AddCoordinate(CoordinateGeoDto request)
        {
            return ExecuteOperation(() =>
            {
                var wktReader = new WKTReader();
                var geometry = wktReader.Read(request.Wkt);

                var coordinate = new CoordinateGeo
                {
                    Id = Guid.NewGuid(),
                    GeoLoc = geometry,
                    Name = request.Name
                };

                coordinateRepository.Add(coordinate);
                unitOfWork.Complete();

                return new Response
                {
                    Data = coordinate,
                    IsSuccess = true,
                    Message = $"Coordinate with id {coordinate.Id} added."
                };
            });
        }

        public Response UpdateCoordinate(Guid id, CoordinateGeoDto request)
        {
            return ExecuteOperation(() =>
            {
                var coordinate = coordinateRepository.GetById(id);
                if (coordinate == null)
                {
                    return new Response { Message = $"Coordinate with id {id} not found." };
                }

                var wktReader = new WKTReader();
                coordinate.GeoLoc = wktReader.Read(request.Wkt);
                coordinate.Name = request.Name;

                coordinateRepository.Update(coordinate);
                unitOfWork.Complete();

                return new Response
                {
                    Data = coordinate,
                    IsSuccess = true,
                    Message = $"Coordinate with id {id} updated."
                };
            });
        }

        public Response DeleteCoordinate(Guid id)
        {
            return ExecuteOperation(() =>
            {
                var coordinate = coordinateRepository.GetById(id);
                if (coordinate == null)
                {
                    return new Response { Message = $"Coordinate with id {id} not found." };
                }

                coordinateRepository.Delete(coordinate);
                unitOfWork.Complete();

                return new Response
                {
                    Data = coordinate,
                    IsSuccess = true,
                    Message = $"Coordinate with id {id} deleted."
                };
            });
        }

        private static Response ExecuteOperation(Func<Response> operation)
        {
            try
            {
                return operation();
            }
            catch (ArgumentException e)
            {
                return new Response
                {
                    Message = $"Invalid argument: {e.Message}",
                };
            }

            catch (DbUpdateException)
            {
                return new Response
                {
                    Message = "An error occurred while updating the database.",
                };
            }
            catch (Exception)
            {
                return new Response
                {
                    Message = "An unexpected error occurred.",
                };
            }
        }
    }
}