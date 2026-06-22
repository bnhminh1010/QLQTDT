FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY QLQTDT.Api.csproj ./
RUN dotnet restore "QLQTDT.Api.csproj"

COPY . ./
RUN dotnet publish "QLQTDT.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

RUN mkdir -p /app/DataProtection-Keys \
    && chown -R app:app /app

USER app

EXPOSE 5000
ENV ASPNETCORE_HTTP_PORTS=5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "QLQTDT.Api.dll"]
