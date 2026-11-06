
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY . .

WORKDIR /src/src/Perry.Api

RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

RUN mkdir -p /app/wwwroot/uploads && chown -R "$APP_UID:$APP_UID" /app/wwwroot/uploads

USER $APP_UID

ENTRYPOINT ["dotnet", "Perry.Api.dll"]
