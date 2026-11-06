
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY . .

WORKDIR /src/src/Perry.Api

RUN dotnet restore
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends --only-upgrade apt \
    && dpkg --compare-versions "$(dpkg-query -W -f='${Version}' apt)" ge "2.8.4ubuntu0.1" \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

RUN mkdir -p /app/wwwroot/uploads && chown -R "$APP_UID:$APP_UID" /app/wwwroot/uploads

USER $APP_UID

ENTRYPOINT ["dotnet", "Perry.Api.dll"]
