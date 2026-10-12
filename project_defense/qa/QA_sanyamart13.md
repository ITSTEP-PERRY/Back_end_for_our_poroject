# Защита — sanyamart13 (Auth UI / Team)

**Роль:** командные экраны входа и восстановления (Trello Team #7–#13, #63 Admin Log in) + участие в admin/merge-карточках.  
**Зона на защите:** поток Login / Register / Verify / Forgot / Reset и админ-вход с точки зрения UI↔Auth.

---

### Чем ты занимался?

Экраны Welcome back / Create account / Send code / Finishing touches / Congratulations / Forgot / Reset (#7–#13), Admin Log in (#63); связанные admin FE/BE карточки (#65–#69, #A01).

### Куда уходит логин?

На Auth Service (не на Product): email/password → JWT → Front кладёт Bearer и ходит в Product.

### Зачем отдельный Admin Log in?

Админ-панель требует роль Admin; отдельный вход/маршрут `/admin/login` по макету Figma.

### Что после успешной регистрации?

Verify code → finishing (имя/фамилия) → success; дальше кабинет/витрина с токеном.

### Forgot / Reset — кто шлёт письмо?

Auth (SMTP/stub на стороне Auth). UI только собирает email и новый пароль + токен/код.

### Как стыкуется с Product?

Product не регистрирует пользователей; после login тот же JWT открывает cart merge, orders, reviews.

### Что показать комиссии?

Демо: Sign up или Log in → успешный вход → защищённый раздел (account или admin login при роли Admin).
