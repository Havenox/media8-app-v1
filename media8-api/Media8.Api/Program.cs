using DotNetEnv;
using Media8.Application;
using Media8.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

// Load .env file from solution root (one level up from Api project, or in root)
// TraversePath() searches up directories for .env
Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
.AddJsonOptions(options =>
{
// Manter PascalCase nativo do C# (não converter para camelCase)
options.JsonSerializerOptions.PropertyNamingPolicy = null;
options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
});
builder.Services.AddEndpointsApiExplorer();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder =>
        {
            builder.AllowAnyOrigin()
                   .AllowAnyMethod()
                   .AllowAnyHeader();
        });
});

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Media 8 API", Version = "v1" });
    
    // JWT Security Definition
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

// Add JWT Authentication
var jwtSecret = builder.Configuration["JWT_SECRET"] ?? throw new ArgumentNullException("JWT_SECRET");
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = "media8-api",
        ValidAudience = "media8-client",
        IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtSecret))
    };
});

// Add Infrastructure (Db, Repositories)
// Configuration values will be read from Environment Variables loaded by DotNetEnv
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

// Add Settings Service (Singleton with In-Memory Cache)
builder.Services.AddSingleton<Media8.Application.Interfaces.ISettingsService, Media8.Application.Services.SettingsService>();

var app = builder.Build();

// Run Seeder and Initialize Settings Cache
using (var scope = app.Services.CreateScope())
{
var context = scope.ServiceProvider.GetRequiredService<Media8.Infrastructure.Data.ApplicationDbContext>();
await context.Database.MigrateAsync();

var seeder = scope.ServiceProvider.GetRequiredService<Media8.Infrastructure.Data.DbSeeder>();
await seeder.SeedAsync();

// Initialize Settings Service cache from database
var settingsService = scope.ServiceProvider.GetRequiredService<Media8.Application.Interfaces.ISettingsService>();
var allSettings = await context.SystemSettings.Select(s => new { s.Key, s.Value }).ToListAsync();
var settingsDict = allSettings.ToDictionary(s => s.Key, s => s.Value);
((Media8.Application.Services.SettingsService)settingsService).LoadFromDictionary(settingsDict);
}

// Configure the HTTP request pipeline.
// Enable Swagger globally
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

// Global Exception Handler for Business Rules
app.Use(async (context, next) =>
{
try
{
await next.Invoke();
}
catch (Media8.Domain.Common.BusinessRuleException ex)
{
// Return 422 Unprocessable Entity for business rule violations
context.Response.StatusCode = 422;
context.Response.ContentType = "application/json";
var result = new { message = ex.Message, errorCode = ex.ErrorCode };
await context.Response.WriteAsJsonAsync(result);
}
catch (Exception ex)
{
// Handle other exceptions as 500
context.Response.StatusCode = 500;
context.Response.ContentType = "application/json";
var errorResult = new { message = "Ocorreu um erro interno no servidor." };
await context.Response.WriteAsJsonAsync(errorResult);
}
});

app.MapControllers();
app.Run();
