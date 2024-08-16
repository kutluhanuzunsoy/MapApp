//using MapApp.Data;
//using MapApp.Dtos;
//using MapApp.Entities;
//using MapApp.Responses;
//using Microsoft.EntityFrameworkCore;
//using System;
//using System.Collections.Generic;
//using System.Linq;

//namespace MapApp.Services
//{
//    public class CoordinateEntityService : ICoordinateService
//    {
//        private readonly MapAppDbContext context;

//        public CoordinateEntityService(MapAppDbContext context)
//        {
//            this.context = context;
//        }

//        public Response GetAllCoordinates()
//        {
//            var result = new Response();

//            try
//            {
//                result.Data = context.Coordinates.ToList();
//                result.IsSuccess = true;
//                result.Message = $"{(result.Data as List<Coordinate>)?.Count ?? 0} coordinates found";
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }

//            return result;
//        }

//        public Response GetCoordinateById(Guid id)
//        {
//            var result = new Response();

//            try
//            {
//                result.Data = context.Coordinates.Find(id);
//                if (result.Data != null)
//                {
//                    result.IsSuccess = true;
//                    result.Message = $"Coordinate with id {id} found";
//                }
//                else
//                {
//                    result.Message = $"Coordinate with id {id} not found";
//                }
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }

//            return result;
//        }

//        public Response AddCoordinate(CoordinateDto coordinateCreateRequest)
//        {
//            var result = new Response();

//            try
//            {
//                var coordinate = new Coordinate
//                {
//                    Id = Guid.NewGuid(),
//                    CoordinateX = coordinateCreateRequest.CoordinateX,
//                    CoordinateY = coordinateCreateRequest.CoordinateY,
//                    Name = coordinateCreateRequest.Name
//                };

//                context.Coordinates.Add(coordinate);
//                context.SaveChanges();

//                result.Data = coordinate;
//                result.IsSuccess = true;
//                result.Message = $"Coordinate with id {coordinate.Id} added";
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }

//            return result;
//        }

//        public Response UpdateCoordinate(Guid id, CoordinateDto coordinateUpdateRequest)
//        {
//            var result = new Response();

//            try
//            {
//                var coordinate = context.Coordinates.Find(id);
//                if (coordinate == null)
//                {
//                    result.Message = $"Coordinate with id {id} not found";
//                    return result;
//                }

//                coordinate.CoordinateX = coordinateUpdateRequest.CoordinateX;
//                coordinate.CoordinateY = coordinateUpdateRequest.CoordinateY;
//                coordinate.Name = coordinateUpdateRequest.Name;

//                context.SaveChanges();

//                result.Data = coordinate;
//                result.IsSuccess = true;
//                result.Message = $"Coordinate with id {id} updated";
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }

//            return result;
//        }

//        public Response DeleteCoordinate(Guid id)
//        {
//            var result = new Response();

//            try
//            {
//                var coordinate = context.Coordinates.Find(id);
//                if (coordinate == null)
//                {
//                    result.Message = $"Coordinate with id {id} not found";
//                    return result;
//                }

//                context.Coordinates.Remove(coordinate);
//                context.SaveChanges();

//                result.Data = coordinate;
//                result.IsSuccess = true;
//                result.Message = $"Coordinate with id {id} deleted";
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }
//            return result;
//        }
//    }
//}