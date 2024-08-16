//using MapApp.Dtos;
//using MapApp.Entities;
//using MapApp.Responses;
//using Microsoft.AspNetCore.Http.HttpResults;
//using Npgsql;
//using System;
//using System.Collections.Generic;
//using System.Data;


////CREATE TABLE coordinates (
////    id UUID PRIMARY KEY,
////    coordinate_x DOUBLE PRECISION,
////    coordinate_y DOUBLE PRECISION,
////    name VARCHAR(255)
////);

//// dbfirst entity orm dbcontext

//namespace MapApp.Services
//{
//    public class CoordinatePostgreSQLService : ICoordinateService
//    {
//        private readonly string connectionString;

//        public CoordinatePostgreSQLService(IConfiguration configuration)
//        {
//            var rawConnectionString = configuration.GetConnectionString("DefaultConnection");
//            var password = Environment.GetEnvironmentVariable("POSTGRESQL_DB_PW");
//            connectionString = rawConnectionString.Replace("${POSTGRESQL_DB_PW}", password);
//        }

//        public Response GetAllCoordinates()
//        {
//            var result = new Response();

//            try
//            {
//                using var connection = new NpgsqlConnection(connectionString);
//                connection.Open();

//                using var command = new NpgsqlCommand("SELECT * FROM coordinates", connection);
//                using var reader = command.ExecuteReader();

//                var coordinates = new List<Coordinate>();
//                while (reader.Read())
//                {
//                    coordinates.Add(new Coordinate
//                    {
//                        Id = reader.GetGuid(0),
//                        CoordinateX = reader.GetDouble(1),
//                        CoordinateY = reader.GetDouble(2),
//                        Name = reader.GetString(3)
//                    });
//                }

//                result.Data = coordinates;
//                result.IsSuccess = true;
//                result.Message = coordinates.Count + " coordinates found";
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
//                using var connection = new NpgsqlConnection(connectionString);
//                connection.Open();

//                using var command = new NpgsqlCommand("SELECT * FROM coordinates WHERE id = @id", connection);
//                command.Parameters.AddWithValue("id", id);

//                using var reader = command.ExecuteReader();
//                if (reader.Read())
//                {
//                    result.Data = new Coordinate
//                    {
//                        Id = reader.GetGuid(0),
//                        CoordinateX = reader.GetDouble(1),
//                        CoordinateY = reader.GetDouble(2),
//                        Name = reader.GetString(3)
//                    };
//                    result.IsSuccess = true;
//                    result.Message = "Coordinate with id " + id + " found";
//                }
//                else
//                {
//                    result.Message = "Coordinate with id " + id + " not found";
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
//                using var connection = new NpgsqlConnection(connectionString);
//                connection.Open();

//                Guid id = Guid.NewGuid();

//                using var command = new NpgsqlCommand(
//                    "INSERT INTO coordinates (id, coordinate_x, coordinate_y, name) VALUES (@id, @x, @y, @name)",
//                    connection);
//                command.Parameters.AddWithValue("id", id);
//                command.Parameters.AddWithValue("x", coordinateCreateRequest.CoordinateX);
//                command.Parameters.AddWithValue("y", coordinateCreateRequest.CoordinateY);
//                command.Parameters.AddWithValue("name", coordinateCreateRequest.Name);

//                command.ExecuteNonQuery();

//                result.Data = new Coordinate
//                {
//                    Id = id,
//                    CoordinateX = coordinateCreateRequest.CoordinateX,
//                    CoordinateY = coordinateCreateRequest.CoordinateY,
//                    Name = coordinateCreateRequest.Name
//                };
//                result.IsSuccess = true;
//                result.Message = "Coordinate with id " + id + " added";
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
//                using var connection = new NpgsqlConnection(connectionString);
//                connection.Open();

//                using var command = new NpgsqlCommand(
//                    "UPDATE coordinates SET coordinate_x = @x, coordinate_y = @y, name = @name WHERE id = @id",
//                    connection);
//                command.Parameters.AddWithValue("id", id);
//                command.Parameters.AddWithValue("x", coordinateUpdateRequest.CoordinateX);
//                command.Parameters.AddWithValue("y", coordinateUpdateRequest.CoordinateY);
//                command.Parameters.AddWithValue("name", coordinateUpdateRequest.Name);

//                int rowsAffected = command.ExecuteNonQuery();

//                if (rowsAffected > 0)
//                {
//                    result.Data = new Coordinate
//                    {
//                        Id = id,
//                        CoordinateX = coordinateUpdateRequest.CoordinateX,
//                        CoordinateY = coordinateUpdateRequest.CoordinateY,
//                        Name = coordinateUpdateRequest.Name
//                    };
//                    result.IsSuccess = true;
//                    result.Message = "Coordinate with id " + id + " updated";
//                }
//                else
//                {
//                    result.Message = "Coordinate with id " + id + " not found";
//                }
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
//                using var connection = new NpgsqlConnection(connectionString);
//                connection.Open();

//                using (var selectCommand = new NpgsqlCommand("SELECT * FROM coordinates WHERE id = @id", connection))
//                {
//                    selectCommand.Parameters.AddWithValue("id", id);
//                    using var reader = selectCommand.ExecuteReader();
//                    if (reader.Read())
//                    {
//                        result.Data = new Coordinate
//                        {
//                            Id = reader.GetGuid(0),
//                            CoordinateX = reader.GetDouble(1),
//                            CoordinateY = reader.GetDouble(2),
//                            Name = reader.GetString(3)
//                        };
//                    }
//                    else
//                    {
//                        result.Message = "Coordinate with id " + id + " not found";
//                        return result;
//                    }
//                }

//                using (var deleteCommand = new NpgsqlCommand("DELETE FROM coordinates WHERE id = @id", connection))
//                {
//                    deleteCommand.Parameters.AddWithValue("id", id);
//                    deleteCommand.ExecuteNonQuery();

//                    result.IsSuccess = true;
//                    result.Message = "Coordinate with id " + id + " deleted";
//                }
//            }
//            catch (Exception e)
//            {
//                result.Message = e.Message;
//            }
//            return result;
//        }
//    }
//}