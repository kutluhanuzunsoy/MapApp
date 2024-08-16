//using MapApp.Dtos;
//using MapApp.Entities;
//using MapApp.Responses;
//using Npgsql;
//using System;
//using System.Collections.Generic;
//using System.Data;

//namespace MapApp.Services
//{
//    public class CoordinateService : ICoordinateService
//    {
//        private readonly string connectionString;

//        public CoordinateService(IConfiguration configuration)
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
//                }
//                else
//                {
//                    result.Message = "Coordinate not found";
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

//                using var command = new NpgsqlCommand(
//                    "INSERT INTO coordinates (coordinate_x, coordinate_y, name) VALUES (@x, @y, @name) RETURNING id",
//                    connection);
//                command.Parameters.AddWithValue("x", coordinateCreateRequest.CoordinateX);
//                command.Parameters.AddWithValue("y", coordinateCreateRequest.CoordinateY);
//                command.Parameters.AddWithValue("name", coordinateCreateRequest.Name);

//                Guid id = Guid.NewGuid();

//                var coordinate = new Coordinate
//                {
//                    Id = id,
//                    CoordinateX = coordinateCreateRequest.CoordinateX,
//                    CoordinateY = coordinateCreateRequest.CoordinateY,
//                    Name = coordinateCreateRequest.Name
//                };

//                result.Data = coordinate;
//                result.IsSuccess = true;
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
//                    var updatedCoordinate = new Coordinate
//                    {
//                        Id = id,
//                        CoordinateX = coordinateUpdateRequest.CoordinateX,
//                        CoordinateY = coordinateUpdateRequest.CoordinateY,
//                        Name = coordinateUpdateRequest.Name
//                    };

//                    result.Data = updatedCoordinate;
//                    result.IsSuccess = true;
//                }
//                else
//                {
//                    result.Message = "Coordinate not found";
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
//                        result.Message = "Coordinate not found";
//                        return result;
//                    }
//                }

//                using (var deleteCommand = new NpgsqlCommand("DELETE FROM coordinates WHERE id = @id", connection))
//                {
//                    deleteCommand.Parameters.AddWithValue("id", id);
//                    int rowsAffected = deleteCommand.ExecuteNonQuery();

//                    if (rowsAffected > 0)
//                    {
//                        result.IsSuccess = true;
//                    }
//                    else
//                    {
//                        result.Message = "Deletion failed";
//                    }
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
