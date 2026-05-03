# Palantir

Clone Discord modernise en 2026 (base tutoriel Code with Antonio), construit avec Next.js App Router, Prisma 7 et Neon Postgres.

## Stack

- Next.js 16 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS v4
- Clerk (auth)
- Prisma 7 + Neon Postgres
- Uploadthing v7
- shadcn/ui
- Vitest + Testing Library
- Playwright (+ axe pour a11y)

## Prerequis

- Node.js 20+
- npm
- Un projet Neon Postgres
- Un projet Clerk

## Installation

```bash
npm install
```

## Variables d'environnement

Creer un fichier `.env` avec au minimum:

```dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

DATABASE_URL=postgresql://...
# Optionnel: si non renseigne, Prisma utilisera DATABASE_URL
DIRECT_URL=postgresql://...

UPLOADTHING_TOKEN=
```

Notes Prisma/Neon:

- `schema.prisma` ne contient pas `url` dans `datasource` (config Prisma 7).
- L'URL est resolue via `prisma.config.ts`.
- `prisma.config.ts` accepte `DIRECT_URL` puis fallback sur `DATABASE_URL`.

## Lancer en local

```bash
npm run dev
```

Application: http://localhost:3000

## Commandes utiles

```bash
# Qualite
npm run lint
npx tsc --noEmit

# Build
npm run build
npm run start

# Tests
npm run test:unit
npm run test:watch
npm run test:e2e
npm run test:e2e:ui
npm run test:a11y

# Prisma
npx prisma migrate dev --name <migration_name>
npx prisma migrate status
npx prisma studio
```

## Etat actuel (resume)

- Auth Clerk operationnelle (sign-in/sign-up + routes)
- Creation de serveur operationnelle via API
- Sidebar serveur + header role-based en place
- Flux d'invitation en cours d'implementation
- Base de tests unitaires et e2e en place

## Depannage

### Erreur Prisma P1001 (Neon)

`P1001: Can't reach database server` signifie que Prisma n'arrive pas a joindre l'endpoint Postgres (reseau, endpoint suspendu, URL invalide, VPN/proxy/firewall, IPv6 instable).

Checklist rapide:

1. Verifier les URLs Neon dans `.env` (`DATABASE_URL` et optionnellement `DIRECT_URL`).
2. Verifier l'endpoint Neon (projet/branche) dans la console.
3. Relancer dans un nouveau terminal (pour recharger les env vars).
4. Tester `npx prisma migrate status`.
5. Si le probleme persiste: tester depuis un autre reseau (partage 4G) pour isoler un probleme local.

### Prisma Studio: `ERR_STREAM_PREMATURE_CLOSE`

Souvent consequence d'une fermeture du process Studio (ex: `Ctrl+C`) ou d'une coupure de connexion DB pendant le streaming.

## Workflow recommande

1. Modifier le schema Prisma
2. Executer `npx prisma migrate dev --name <nom>`
3. Executer `npx prisma generate`
4. Lancer les tests (`npm run test:unit` puis `npm run test:e2e` selon le scope)

## Roadmap post-tutoriel

- Phase d'optimisation complete (perf, architecture, dette technique)
- Phase de tests complete (unitaires, integration, e2e, a11y, non-regression)
