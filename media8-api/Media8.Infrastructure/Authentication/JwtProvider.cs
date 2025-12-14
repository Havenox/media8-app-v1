using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Media8.Application.Interfaces;
using Media8.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Media8.Infrastructure.Authentication;

public class JwtProvider : IJwtProvider
{
    private readonly IConfiguration _configuration;

    public JwtProvider(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string Generate(User user)
    {
        var secretKey = _configuration["JWT_SECRET"];
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email)
        };
        
        // Add Roles
        foreach (var userRole in user.Roles)
        {
            claims.Add(new Claim("role", userRole.Role.ToString())); 
            claims.Add(new Claim(ClaimTypes.Role, userRole.Role.ToString()));
        }

        // Add Profile data if needed
        if (user.Profile != null)
        {
            claims.Add(new Claim("name", user.Profile.Name));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(60),
            SigningCredentials = credentials,
            Issuer = "media8-api",
            Audience = "media8-client"
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.CreateToken(tokenDescriptor);

        return handler.WriteToken(token);
    }
}
