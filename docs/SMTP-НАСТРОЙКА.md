# SMTP: stub → реальная почта (#14)

В проекте письма идут через `IEmailSender`:

| Режим | Класс | Когда |
|-------|--------|--------|
| **Stub** (по умолчанию) | `StubEmailSender` | `Smtp:UseStub: true` — тело письма в **лог** |
| **Реальный SMTP** | `SmtpEmailSender` | `Smtp:UseStub: false` + заполненные поля |

Регистрация в DI: `Perry.Infrastructure/DependencyInjection.cs`.

---

## 1. Демо (оставить как есть)

`src/Perry.Api/appsettings.Development.json`:

```json
"Smtp": {
  "UseStub": true
}
```

Коды VerifyCode / Forgot / Change email смотреть в консоли `dotnet run` (и иногда в JSON-ответе stub).

---

## 2. Включить Gmail App Password

1. Google Account → Security → 2-Step Verification → **App passwords** → создать пароль для «Mail».  
2. В **user-secrets** или локальном `appsettings.Development.json` (не коммитить пароль):

```json
"Smtp": {
  "UseStub": false,
  "Host": "smtp.gmail.com",
  "Port": 587,
  "From": "your@gmail.com",
  "Username": "your@gmail.com",
  "Password": "xxxx xxxx xxxx xxxx",
  "EnableSsl": true
}
```

Через secrets:

```bash
cd src/Perry.Api
dotnet user-secrets set "Smtp:UseStub" "false"
dotnet user-secrets set "Smtp:From" "your@gmail.com"
dotnet user-secrets set "Smtp:Username" "your@gmail.com"
dotnet user-secrets set "Smtp:Password" "your-app-password"
dotnet user-secrets set "Smtp:Host" "smtp.gmail.com"
dotnet user-secrets set "Smtp:Port" "587"
```

3. Перезапустить API. Проверить Forgot password / Send code на свой email.

Тот же блок Smtp уже есть в `Perry.Web/appsettings.json` (шаблон с плейсхолдером пароля).

---

## 3. Для защиты

Достаточно stub + речь: [РЕЧЬ-SMTP-ДЕМО.md](./РЕЧЬ-SMTP-ДЕМО.md).  
Реальный SMTP — бонус, если успеете настроить App Password заранее.
