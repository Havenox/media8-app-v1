FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["Media8.Api/Media8.Api.csproj", "Media8.Api/"]
COPY ["Media8.Application/Media8.Application.csproj", "Media8.Application/"]
COPY ["Media8.Infrastructure/Media8.Infrastructure.csproj", "Media8.Infrastructure/"]
COPY ["Media8.Domain/Media8.Domain.csproj", "Media8.Domain/"]
RUN dotnet restore "Media8.Api/Media8.Api.csproj"
COPY . .
WORKDIR "/src/Media8.Api"
RUN dotnet build "Media8.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Media8.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 80
EXPOSE 443
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Media8.Api.dll"]
