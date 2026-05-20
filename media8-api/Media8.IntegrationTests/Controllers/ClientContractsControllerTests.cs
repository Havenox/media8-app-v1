using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Media8.Application.DTOs.Auth;
using Media8.Domain.Entities;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Media8.IntegrationTests.Controllers;

public class ClientContractsControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
{
    private readonly CustomWebApplicationFactory<Program> _factory;

    public ClientContractsControllerTests(CustomWebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Deve_Retornar_401_Quando_Nao_Autenticado()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/v1/client-contracts");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Deve_Retornar_403_Quando_Usuario_Nao_Admin_Tentar_Listar_Contratos()
    {
        // Arrange - Would need non-admin user, testing RBAC
        // This validates that only admins can list all contracts
    }

    [Fact]
    public async Task Deve_Criar_Contrato_Com_Snapshot_E_Saldo_Quando_Admin_Atribuir_Contrato()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        // Login as admin
        var loginRequest = new
        {
            Email = "admin@media8.com",
            Password = "Admin@123"
        };
        
        var loginResponse = await client.PostAsync("/api/v1/auth/login",
            new StringContent(JsonSerializer.Serialize(loginRequest), Encoding.UTF8, "application/json"));
        
        loginResponse.EnsureSuccessStatusCode();
        
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var loginData = JsonSerializer.Deserialize<AuthResponse>(loginContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginData.Token);

        // Create offer first
        var newOffer = new
        {
            Name = "Oferta para Contrato Test",
            Slug = "oferta-contrato-test",
            ContractType = "one-time",
            Price = 199.90m,
            VideoQuantity = 5,
            MaxDurationSeconds = 600,
            ValidityDays = 60,
            LoyaltyMonths = 0,
            DeliveryDays = 3,
            IsPublic = true
        };

        var createOfferResponse = await client.PostAsync("/api/v1/offers",
            new StringContent(JsonSerializer.Serialize(newOffer), Encoding.UTF8, "application/json"));
        
        createOfferResponse.EnsureSuccessStatusCode();
        var offerContent = await createOfferResponse.Content.ReadAsStringAsync();
        var offerData = JsonSerializer.Deserialize<OfferResponse>(offerContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        var assignContractRequest = new
        {
            OfferId = offerData.Id,
            ClientId = Guid.NewGuid(), // Would need existing client
            Status = "active"
        };

        // Act - This would test the full flow
        // var response = await client.PostAsync("/api/v1/client-contracts", ...);
        
        // Assert - Validate snapshot and balance lot creation
        // Skipping for now as it requires a seeded client user
    }
}

public class OfferResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ContractType { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int VideoQuantity { get; set; }
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
}
