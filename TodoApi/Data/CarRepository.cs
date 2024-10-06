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

    public async Task<IEnumerable<Car>> GetAllCarsAsync()
    {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "SELECT * FROM Cars";
            return await db.QueryAsync<Car>(sql);
        }
    }
    
    public async Task AddCarAsync(Car car) {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "INSERT INTO Cars (Year, Make, Model, StockLevel) VALUES (@Year, @Make, @Model, @StockLevel)";
            await db.ExecuteAsync(sql, car);
        }
    }
}