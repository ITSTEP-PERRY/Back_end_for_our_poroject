FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Копируем только файлы проектов для восстановления зависимостей
# Если у вас мультипроектное решение (Solution), скопируйте файлы всех связанных .csproj
COPY ["src/Perry.Api/Perry.Api.csproj", "src/Perry.Api/"]
# Если есть другие библиотеки/проекты, от которых зависит Perry.Api, добавьте их сюда, например:
COPY ["src/Perry.Core/Perry.Domain.csproj", "src/Perry.Domain/"]
COPY ["src/Perry.Core/Perry.Infrastructure.csproj", "src/Perry.Infrastructure/"]

# 2. Быстро восстанавливаем пакеты. Этот слой закэшируется и не будет выполняться заново
RUN dotnet restore "src/Perry.Api/Perry.Api.csproj" --disable-parallel 

WORKDIR /src/src/Perry.Api

# 4. Собираем приложение (флаг --no-restore использует уже скачанные на шаге 2 пакеты)
RUN dotnet publish -c Release -o /app/publish --no-restore

# Финальный легковесный образ среды выполнения
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Perry.Api.dll"]
