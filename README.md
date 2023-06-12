
# Для тренировки решил тестовое задание [отсюда](https://fundraiseup.notion.site/Backend-test-0e0e0961077e4e74bb6afc42dcf1759a)

## Prerequirements

Required MongoDB database

Database link setup in `DB_URI` column in ` .env` file.
You can find example in `.env.example` file.

## Installation

Install all dependencies with npm

```bash
  npm i
```
    
## Start

At first build
```bash
  npm run build
```


Start `app.ts`
```bash
  npm run app
```

Start `sync.ts`, real-time sync
```bash
  npm run sync
```

Start `sync.ts`, full reindex
```bash
  npm run sync -- --full-reindex
```

If you want to see debug messages, run application with variable `DEBUG=1`, e.q.

```bash
  DEBUG=1 npm run app
  DEBUG=1 npm run sync
  DEBUG=1 npm run sync -- --full-reindex
```
