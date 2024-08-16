using System.Collections.Generic;

namespace MapApp.Responses
{
    public class Response
    {
        public object Data { get; set; }
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
    }
}