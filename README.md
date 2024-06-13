# Получить telegram user_id через bh_id

## .env

    APP_PORT=
    SOCKET_URL=
    BH_LOGIN_URL=
    BH_USERNAME=
    BH_PASSWORD=

## Запуск

```
pnpm i && pnpm start
```

## Получение данных

```
curl --location 'localhost:3000' \
--header 'Content-Type: application/json' \
--data '{
    "newChatId": 323
}'
```
