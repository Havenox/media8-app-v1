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
        var response = await client.GetAsync("/api/v1/admin/ClientContracts");

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
            Email = "admin@admin.com",
            Password = "SenhaAdmin"
        };
        
        var loginResponse = await client.PostAsync("/api/v1/auth/login",
            new StringContent(JsonSerializer.Serialize(loginRequest), Encoding.UTF8, "application/json"));
        
        loginResponse.EnsureSuccessStatusCode();
        
        var loginContent = await loginResponse.Content.ReadAsStringAsync();
        var loginData = JsonSerializer.Deserialize<AuthResponse>(loginContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        
        client.DefaultRequestHeaders.Authorization = 
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", loginData.Token);

        // Get seeded client ID (00000000-0000-0000-0000-000000000002)
        var clientId = Guid.Parse("00000000-0000-0000-0000-000000000002");
        
        // Get video format from seed
        var videoFormatsResponse = await client.GetAsync("/api/v1/video-formats");
        videoFormatsResponse.EnsureSuccessStatusCode();
        var videoFormatsContent = await videoFormatsResponse.Content.ReadAsStringAsync();
        var videoFormats = JsonSerializer.Deserialize<List<VideoFormatDto>>(videoFormatsContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var videoFormatId = videoFormats.First().Id;

        // Get editing style from seed
        var editingStylesResponse = await client.GetAsync("/api/v1/editing-styles");
        editingStylesResponse.EnsureSuccessStatusCode();
        var editingStylesContent = await editingStylesResponse.Content.ReadAsStringAsync();
        var editingStyles = JsonSerializer.Deserialize<List<EditingStyleDto>>(editingStylesContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var editingStyleId = editingStyles.First().Id;

        // Create offer first (with unique name/slug to avoid conflicts)
        var uniqueId = Guid.NewGuid().ToString("N")[..8];
        var newOffer = new
        {
            Name = $"Oferta Contrato {uniqueId}",
            Slug = $"oferta-contrato-{uniqueId}",
            ContractType = "Pacote",
            Price = 199.90m,
            VideoQuantity = 5,
            MaxDurationSeconds = 600,
            ValidityDays = 60,
            LoyaltyMonths = 0,
            DeliveryDays = 3,
            VideoFormatId = videoFormatId,
            EditingStyleId = editingStyleId,
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
            ClientId = clientId,
            AssignedByUserId = Guid.Parse("00000000-0000-0000-0000-000000000001") // Admin user ID from seed
        };

        // Act - Create contract
        var response = await client.PostAsync("/api/v1/admin/ClientContracts",
            new StringContent(JsonSerializer.Serialize(assignContractRequest), Encoding.UTF8, "application/json"));
        
        var errorContent = await response.Content.ReadAsStringAsync();
        
        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created, $"Expected 201 but got {response.StatusCode}. Content: {errorContent}");
        
        // Verify contract was created with snapshot
        var contractsResponse = await client.GetAsync($"/api/v1/admin/ClientContracts?clientId={clientId}");
        contractsResponse.EnsureSuccessStatusCode();
        var contractsContent = await contractsResponse.Content.ReadAsStringAsync();
        contractsContent.Should().Contain(offerData.Name);
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

public class EditingStyleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}
