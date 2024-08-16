using System.Text.Json;
using System.Text.Json.Serialization;
using NetTopologySuite.Geometries;
using NetTopologySuite.IO;

public class GeometryConverter : JsonConverter<Geometry>
{
    public override Geometry Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            string geometryString = reader.GetString();

            WKTReader WktReader = new();
            Geometry geometry = WktReader.Read(geometryString);

            return geometry;
        }
        else
        {
            throw new JsonException();
        }
    }

    public override void Write(Utf8JsonWriter writer, Geometry value, JsonSerializerOptions options)
    {
        if (value != null && !value.IsEmpty)
        {
            WKTWriter WktWriter = new();
            string geometryString = WktWriter.Write(value);
            writer.WriteStringValue(geometryString);
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}