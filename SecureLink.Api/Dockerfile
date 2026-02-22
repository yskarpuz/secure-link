FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY securelink-web/package*.json ./
RUN npm ci
COPY securelink-web/ .
ARG NEXT_PUBLIC_AZURE_CLIENT_ID
ARG NEXT_PUBLIC_AZURE_TENANT_ID=common
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_AZURE_CLIENT_ID=$NEXT_PUBLIC_AZURE_CLIENT_ID
ENV NEXT_PUBLIC_AZURE_TENANT_ID=$NEXT_PUBLIC_AZURE_TENANT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /src
COPY SecureLink.sln .
COPY SecureLink.Api/SecureLink.Api.csproj SecureLink.Api/
COPY SecureLink.ServiceDefaults/SecureLink.ServiceDefaults.csproj SecureLink.ServiceDefaults/
RUN dotnet restore SecureLink.Api/SecureLink.Api.csproj
COPY SecureLink.Api/ SecureLink.Api/
COPY SecureLink.ServiceDefaults/ SecureLink.ServiceDefaults/
RUN dotnet publish SecureLink.Api/SecureLink.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
COPY --from=backend-build /app/publish .
COPY --from=frontend-build /app/out ./wwwroot
USER appuser
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "SecureLink.Api.dll"]
