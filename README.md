# PuntoVerde Web

Aplicación web POS de PuntoVerde — React + Vite + Firebase.

**Producción:** https://abarrotes-digitales.web.app

## Stack

- React 19 + Vite 8
- Firebase (Auth, Firestore, Storage, Hosting)
- React Router DOM 7
- Bootstrap 5, Chart.js, qrcode, ZXing (scanner)

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build       # genera dist/
npm run preview     # sirve dist/ localmente
```

## Deploy a producción

```bash
./deploy.sh
```

Requiere `firebase login` previo. El script hace `npm run build` y `firebase deploy --only hosting` contra el proyecto `abarrotes-digitales`.

Ver [DEPLOY_TUTORIAL.md](./DEPLOY_TUTORIAL.md) para el proceso manual y troubleshooting.

## Estructura

```
src/        # código React
public/     # assets estáticos
firebase.json    # config de Firebase Hosting + Storage
.firebaserc      # apunta al proyecto abarrotes-digitales
storage.rules    # reglas de Firebase Storage
```

## Relacionados

- [`punto-verde`](../punto-verde) — app nativa Swift/macOS (misma marca, mismo Firestore)
