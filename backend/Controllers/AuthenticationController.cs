using Microsoft.AspNetCore.Mvc; // For ControllerBase, ApiController, and IActionResult
using System.Threading.Tasks; // For Task and async/await
using UserApi.Models;

[ApiController]
[Route("api/[controller]")]

public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly UserRepository _userRepository;

    public AuthController(AuthService authService, UserRepository userRepository)
    {
        _authService = authService;
        _userRepository = userRepository;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userRepository.GetUserByCredentialsAsync(request.Username, request.Password);

        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }
        
        var token = _authService.GenerateJwtToken(user);

        return Ok(new { token });
    }
}

public class LoginRequest
{
    public string Username { get; set; }
    public string Password { get; set; }
}


