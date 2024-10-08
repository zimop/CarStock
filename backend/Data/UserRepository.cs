using UserApi.Models;
using Dapper;
using Microsoft.Data.Sqlite;
using Microsoft.VisualBasic;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;

public class UserRepository{
    private readonly string _connectionString;

    public UserRepository(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<User?> GetUserByCredentialsAsync(string username, string password)
    {
        using (IDbConnection db = new SqliteConnection(_connectionString))
        {
            string sql = "SELECT * FROM Users WHERE Username = @Username AND Password = @Password";
            var user = await db.QueryFirstOrDefaultAsync<User>(sql, new {Username = username, Password = password});
            return user;
        }
    }
}