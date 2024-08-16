//using MapApp.Entities;
//using MapApp.Responses;
//using System;
//using System.Collections.Generic;

//namespace MapApp.Services
//{
//    public class CoordinateService : ICoordinateService
//    {
//        private static readonly List<Coordinate> coordinatesList = [];

//        public Response GetAllCoordinates()
//        {
//            var result = new Response();
//            try
//            {
//                result.Data = coordinatesList;
//                result.IsSuccess = true;
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }
//            return result;
//        }

//        public Response GetCoordinateById(long id)
//        {
//            var result = new Response();
//            try
//            {
//                var coordinate = coordinatesList.FirstOrDefault(c => c.Id == id);
//                if (coordinate == null)
//                {
//                    result.Message = "Coordinate not found";
//                    return result;
//                }
//                result.Data = coordinate;
//                result.IsSuccess = true;
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }
//            return result;
//        }

//        public Response AddCoordinate(Coordinate coordinate)
//        {
//            var result = new Response();
//            try
//            {
//                Random random = new();
//                int randomId;
//                do
//                {
//                    randomId = random.Next(1, int.MaxValue);
//                } while (coordinatesList.Any(c => c.Id == randomId));

//                coordinate.Id = randomId;
//                coordinatesList.Add(coordinate);

//                result.Data = coordinate;
//                result.IsSuccess = true;
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }
//            return result;
//        }

//        public Response UpdateCoordinate(long id, Coordinate coordinate)
//        {
//            var result = new Response();
//            try
//            {
//                var existingCoordinate = coordinatesList.FirstOrDefault(c => c.Id == id);
//                if (existingCoordinate == null)
//                {
//                    result.Message = "Coordinate not found";
//                    return result;
//                }

//                existingCoordinate.CoordinateX = coordinate.CoordinateX;
//                existingCoordinate.CoordinateY = coordinate.CoordinateY;
//                existingCoordinate.Name = coordinate.Name;

//                result.Data = existingCoordinate;
//                result.IsSuccess = true;
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }
//            return result;
//        }

//        public Response DeleteCoordinate(long id)
//        {
//            var result = new Response();
//            try
//            {
//                var coordinateToDelete = coordinatesList.FirstOrDefault(c => c.Id == id);
//                if (coordinateToDelete == null)
//                {
//                    result.Message = "Coordinate not found";
//                    return result;
//                }

//                result.Data = coordinateToDelete;
//                result.IsSuccess = true;
//                coordinatesList.Remove(coordinateToDelete);
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }

//            return result;
//        }
//    }
//}