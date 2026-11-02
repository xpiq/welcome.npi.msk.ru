# NPI welcome site

Публичный сайт NPI на Next.js 14. Контент для главной, контактов, преимуществ и услуг публикуется через Strapi.

## Локальный запуск

```bash
npm install
npm run dev
```

Для server-side запросов к CMS используется `STRAPI_INTERNAL_URL`; по умолчанию — `http://127.0.0.1:1337`.

## Проверка и публикация

```bash
npm run lint
npm run build
```

На production frontend обслуживается сервисами `frontend.service` и `site-frontend-test.service`. После обновления нужно проверить оба процесса, локальный HTTP и внешний HTTPS `https://welcome.npi.msk.ru/`.
