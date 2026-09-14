

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Data;
using Backend.Dtos;
using Backend.ErrorHandling;
using Google.Apis.Auth;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Auth.OAuth2.Flows;
using Google.Apis.Auth.OAuth2.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _appDbContext;
    private readonly IConfiguration _config;
    public AuthController(
        AppDbContext appDbContext,
        IConfiguration configuration
    )
    {
        _appDbContext = appDbContext;
        _config = configuration;
    }

    private string GenerateJWT(Guid id)
    {
        var claims = new[] {
            new Claim(ClaimTypes.NameIdentifier, id.ToString()),
        };
        var secretKey = _config["JWT_SECRET"]
            ?? throw new Exception("No jwt secret");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );
        var result = new JwtSecurityTokenHandler().WriteToken(token);
        return result;
    }

    private async Task<string> GetGoogleJWT(string code)
    {
        var clientSecrets = new ClientSecrets
        {
            ClientId = _config["GOOGLE_ID"],
            ClientSecret = _config["GOOGLE_SECRET"]
        };

        var flow = new GoogleAuthorizationCodeFlow(new GoogleAuthorizationCodeFlow.Initializer
        {
            ClientSecrets = clientSecrets
        });
        try
        {
            TokenResponse tokenResponse = await flow.ExchangeCodeForTokenAsync(
                userId: "user", 
                code: code, 
                redirectUri: "postmessage",
                CancellationToken.None
            );

            return tokenResponse.IdToken;
        } catch (TokenResponseException)
        {
            throw new DomainException("Invalid google code", 400);
        }
    }
    private async Task<string> GetAdminJWT(LoginDto dto)
    {
        var jwt = dto.JWT ?? await GetGoogleJWT(dto.Code ?? "");
        var validationSettings = new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = [_config["GOOGLE_ID"]]
        };

        GoogleJsonWebSignature.Payload payload = await GoogleJsonWebSignature.ValidateAsync(
            jwt, 
            validationSettings
        );

        var admin = await _appDbContext.Admins.FirstOrDefaultAsync(x => x.ProviderId == payload.Subject);
        if (admin is not null) {
            admin.Picture = payload.Picture;
            admin.Name = payload.Name;
            await _appDbContext.SaveChangesAsync();
            return GenerateJWT(admin.Id); 
        }

        var newAdmin = await _appDbContext.Admins.FirstOrDefaultAsync(x => x.Email == payload.Email);
        if (newAdmin is not null)
        {
            newAdmin.Picture = payload.Picture;
            newAdmin.ProviderId = payload.Subject;
            newAdmin.Name = payload.Name;
            await _appDbContext.SaveChangesAsync();
            return GenerateJWT(newAdmin.Id); 
        }
        throw new DomainException("Uknown user", 400);
    }

    [HttpPost("login")]
    public async Task<IActionResult> GoogleLogin(LoginDto dto)
    {
        var token = await GetAdminJWT(dto);
        Response.Cookies.Append("auth_token", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = _config["MODE"] == "prod", // Set to true in production (HTTPS)
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new { success = true });
    }
    
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("auth_token");
        return Ok(new { success = true });
    }
}