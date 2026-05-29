using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Media8.Application.DTOs.Auth;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Media8.IntegrationTests.Controllers;

public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> _factory;

    public AuthControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Deve_Retornar_Sucesso_Quando_Login_For_Valido()
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new
        {
            Email = "admin@admin.com",
            Password = "SenhaAdmin"
        };

        // Act
        var response = await client.PostAsync("/api/v1/auth/login",
            new StringContent(JsonSerializer.Serialize(loginRequest), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().NotBeNullOrEmpty();
        responseContent.Should().Contain("Token");
    }

    [Fact]
    public async Task Deve_Retornar_Unauthorized_Quando_Senha_For_Incorreta()
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new
        {
            Email = "admin@admin.com",
            Password = "SenhaErrada123"
        };

        // Act
        var response = await client.PostAsync("/api/v1/auth/login",
            new StringContent(JsonSerializer.Serialize(loginRequest), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Deve_Retornar_BadRequest_Quando_Email_Nao_Existir()
    {
        // Arrange
        var client = _factory.CreateClient();
        var loginRequest = new
        {
            Email = "naoexiste@exemplo.com",
            Password = "Senha123"
        };

        // Act
        var response = await client.PostAsync("/api/v1/auth/login",
            new StringContent(JsonSerializer.Serialize(loginRequest), Encoding.UTF8, "application/json"));

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
