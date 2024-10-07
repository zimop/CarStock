using CarStockApi.Models;
using Dapper;
using Microsoft.Data.Sqlite;
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
    public async Task<IEnumerable<Car>> GetAllCarsAsync()
    {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "SELECT * FROM Cars";
            return await db.QueryAsync<Car>(sql);
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
    public async Task AddCarAsync(Car car) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "INSERT INTO Cars (Year, Make, Model, StockLevel) VALUES (@Year, @Make, @Model, @StockLevel)";
            await db.ExecuteAsync(sql, car);
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
    public async Task<int> SearchByCar( string make, string model, int year) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "SELECT id FROM Cars WHERE make = @Make AND model = @Model AND year = @Year";
            int carId = await db.QuerySingleAsync<int>(sql, new {Make = make, Model = model, Year = year});
            return carId;
        }
    }
}