# ============================================================
# Stage 1: Build
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files first for layer caching on restore
COPY SecureLink.sln .
COPY SecureLink.Api/SecureLink.Api.csproj SecureLink.Api/
COPY SecureLink.ServiceDefaults/SecureLink.ServiceDefaults.csproj SecureLink.ServiceDefaults/

# Restore dependencies
RUN dotnet restore SecureLink.Api/SecureLink.Api.csproj

# Copy source code
COPY SecureLink.Api/ SecureLink.Api/
COPY SecureLink.ServiceDefaults/ SecureLink.ServiceDefaults/

# Publish release build
RUN dotnet publish SecureLink.Api/SecureLink.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ============================================================
# Stage 2: Runtime
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

COPY --from=build /app/publish .

# Switch to non-root user
USER appuser

# Azure Container Apps terminates TLS at the ingress layer;
# the container only needs to listen on HTTP.
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "SecureLink.Api.dll"]
