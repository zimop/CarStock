namespace CarStockApi.Models{
    public class Car{
        public required string Id;
        public int Year {get; set;}
        public required string Make {get; set;}
        public required string Model {get; set;}

        public int StockLevel {get; set;}
    }
}