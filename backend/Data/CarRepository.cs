using CarStockApi.Models;
using Dapper;
using Microsoft.Data.Sqlite;
using Microsoft.VisualBasic;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;


public class CarRepository{
    private readonly string _connectionString;

    public CarRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    // Get
    public async Task<IEnumerable<Car>> GetAllCarsAsync(int id)
    {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "SELECT * FROM Cars WHERE userID = @Id";
            return await db.QueryAsync<Car>(sql, new {Id = id});
        }
    }

    // Get car by id

    public async Task<IEnumerable<Car>> GetCarById(int id)
    {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "SELECT * FROM Cars WHERE id = @Id";
            return await db.QueryAsync<Car>(sql, new {Id = id});
        }
    }

    // Insert
    public async Task AddCarAsync(Car car, int userId) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            int year = car.Year;
            string make = car.Make;
            string model = car.Model;
            int stockLevel = car.StockLevel;
            string sql = "INSERT INTO Cars (Year, Make, Model, StockLevel, UserID) VALUES (@Year, @Make, @Model, @StockLevel, @UserID);";
            await db.ExecuteAsync(sql, new {Year = year, Make = make, Model = model, StockLevel = stockLevel, UserID = userId});
        }
    }

    // Delete
    public async Task<int> RemoveCarAsync(int id) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = $"DELETE FROM Cars WHERE id = @Id";
            int rowsAffected = await db.ExecuteAsync(sql, new {Id = id});
            return rowsAffected;
        }
    }

    // Search for a car and return an id
    public async Task<int> SearchByCar( string make, string model, int year, int userId) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "SELECT id FROM Cars WHERE make = @Make AND model = @Model AND year = @Year AND userID = @UserId";
            int carId = await db.QuerySingleAsync<int>(sql, new {Make = make, Model = model, Year = year, UserId = userId});
            return carId;
        }
    }

    // Update car stock level

    public async Task<int> UpdateCarAsync(int id, int stockLevel) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "UPDATE Cars SET stockLevel = @StockLevel WHERE id = @Id";
            int rowsAffected = await db.ExecuteAsync(sql, new {StockLevel = stockLevel, Id = id});
            return rowsAffected;
        }
    }

    // Searching for values:

    public async Task<IEnumerable<Car>> Search( string make, string model, int id) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            Console.WriteLine("hello");
            Console.WriteLine(make);
            Console.WriteLine(model);
            string sql = "SELECT * FROM Cars WHERE make LIKE @Make AND model LIKE @Model AND userID = @Id";
            var cars =  await db.QueryAsync<Car>(sql, new 
            {
                Make = make + "%", 
                Model = model + "%",
                Id = id,
            });

            return cars.Any() ? cars : new List<Car>();
        }
    }
}