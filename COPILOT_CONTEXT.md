# Contexte Projet Palantir — Discord Clone 2026

## Objectif du projet
Réalisation d'un clone de Discord en suivant le tutoriel d'Antonio Erdeljac (YouTube, ~12h, 2023),
**volontairement modernisé en 2026** avec les dernières versions de chaque librairie.
Le dépôt GitHub d'Antonio ayant été supprimé, il n'y a pas de repo de référence.

---

## Stack technique actée

| Rôle | Choix | Notes |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Déjà installé |
| **Langage** | TypeScript 5 | Déjà installé |
| **Styling** | Tailwind CSS v4 | Déjà installé |
| **Auth** | Clerk v7+ | Installé et intégré |
| **ORM** | Prisma v7 | Installé et intégré |
| **Base de données** | Neon (PostgreSQL) | Remplace PlanetScale (MySQL) du tuto |
| **Upload fichiers** | Uploadthing v7+ | API très différente du tuto (v4) |
| **UI Components** | shadcn/ui (dernière CLI) | `npx shadcn@latest` |
| **Temps réel (messages)** | Socket.io | Stable, pas de changement majeur |
| **Voix / Vidéo** | Daily.co | Remplace Livekit (devenu payant) |
| **Déploiement** | Vercel | |

---

## Décisions importantes

### Pourquoi Neon à la place de PlanetScale ?
PlanetScale a modifié son modèle freemium. Neon offre un free tier généreux en PostgreSQL.
Prisma supporte PostgreSQL nativement, le changement est transparent.

### Pourquoi Daily.co à la place de Livekit ?
Livekit est devenu payant pour sa version réellement intéressante.
Daily.co couvre le besoin réel du projet :
- Sessions de visio jusqu'à 15 personnes
- ~6h/mois = ~5 400 participant-minutes/mois
- Free tier Daily.co = 10 000 participant-minutes/mois → largement suffisant ✅

### WebRTC natif écarté pour la voix/vidéo
Trop complexe pour plus de 2 participants sans architecture SFU dédiée.
Daily.co expose WebRTC sous une API simple sans la complexité.

---

## Features supplémentaires prévues (hors tuto)

### Compteur de minutes Daily.co dans le dashboard admin
- Appel à l'API REST Daily.co (`/api/v1/usage`)
- Calcul : `10 000 - participant_minutes_used`
- Affichage d'une jauge colorée (vert → orange → rouge)
- Alerte visuelle au-delà de 80% du quota
- Remise à zéro mensuelle automatique
- **À implémenter lors de la construction du dashboard admin**

---

## Points de vigilance vs le tuto (APIs ayant changé)

| Librairie | Version tuto (2023) | Version 2026 | Changement majeur |
|---|---|---|---|
| Clerk | v4 | v6+ | Composants et hooks renommés |
| Prisma | v4 | v7 | `url` retiré de `schema.prisma`, config via `prisma.config.ts` |
| Uploadthing | v4 | v7+ | Composants entièrement refaits |
| shadcn/ui | ancienne CLI | nouvelle CLI | Commande d'install différente |
| Next.js | 13 | 16 | App Router, Server Actions évoluées |

---

## État actuel du projet (avril 2026)

- Auth Clerk en place (sign-in/sign-up + route setup).
- Prisma généré et première migration exécutée sur Neon.
- Client Prisma branché via `@prisma/adapter-neon`.
- Base de tests installée avec Vitest + premiers tests sur `initialProfile`.

### Mise à jour branche `feat/server-creation-api` (30 avril 2026)

- Création de la route API `POST /api/servers` dans `app/api/servers/route.ts`.
- Ajout de `lib/current-profile.ts` pour récupérer le profil courant côté serveur.
- Ajout du composant `components/modals/initial-modal.tsx` et intégration dans `app/(setup)/page.tsx`.
- Correction du chemin d'import modal : `models` -> `modals`.
- Correction Prisma sur création de serveur : champ `imageURL` (et non `imageUrl`) pour le modèle `Server`.

### Correctifs stabilité/qualité appliqués

- Correction TypeScript/Clerk : usage serveur `auth` via `@clerk/nextjs/server` dans `lib/current-profile.ts`.
- Correction config Vitest : suppression de `environmentMatchGlobs` (non supporté par les types utilisés ici).
- Ajout des types de tests dans `tsconfig.json` : `vitest/globals` et `@testing-library/jest-dom`.
- Nettoyage de `vitest.setup.ts` : suppression d'une directive `@ts-expect-error` inutile.

### Validation de la branche (statut au 30 avril 2026)

- `npm run lint` : OK
- `npx tsc --noEmit` : OK
- `npm run build` : OK
- `npm run test:unit` : OK
- `npm run test:e2e` : OK

### Dette technique restante (non bloquante)

- Harmoniser le nommage `imageURL` vs `imageUrl` dans le schéma Prisma (migration future).
- Ajouter une validation serveur Zod dans `POST /api/servers` (validation aujourd'hui seulement côté client).
- Remplacer le double rafraîchissement client (`router.refresh()` + `window.location.reload()`) par une navigation ciblée après création.

---

### Mise à jour branche `feat/invitations` (3 mai 2026)

- Implémentation de la page d'invitation `app/(invite)/(routes)/invite/[inviteCode]/page.tsx`.
- Correction TypeScript Next.js 16 : `params` est une `Promise<>`, accès via `await params` (non pas `params.inviteCode` directement).

#### Audit et durcissement des rôles

- **Permissions GUEST validées** : Le composant `ServerHeader` affiche uniquement "Leave Server" pour un GUEST. Les actions modérateur (Invite People, Create Channel) et admin (Server settings, Manage members, Delete Server) sont masquées.
- **Contrôle d'accès serveur renforcé** : `ServerSidebar` utilise maintenant `findUnique.where.members.some.profileId` pour exiger que le profil courant soit membre du serveur avant d'afficher la sidebar. Tout non-membre est redirigé vers `/`.
- **Variables non utilisées supprimées** : `textChannels`, `audioChannels`, `videoChannels`, `members` retirés de `server-sidebar.tsx` (nettoyage lint).

#### Corrections qualité

- **`hooks/use-origin.ts`** : Réécriture avec `useSyncExternalStore` pour éviter l'erreur ESLint `react-hooks/set-state-in-effect` (setState synchrone dans useEffect).
- **`prisma.config.ts`** : Remplacement de `env["DATABASE_URL"]` par `process.env.DATABASE_URL!` (erreur TypeScript sur la fonction `env` strictement typée de Prisma).

#### Infrastructure de tests e2e authentifiés (en cours)

- Ajout d'un projet Playwright `setup` avec `storageState` (`e2e/.auth/user.json`) partagé entre les tests Chromium.
- `e2e/auth.setup.ts` : login automatique Clerk en deux étapes (email → code OTP via `424242` en dev mode).
- `e2e/server-sidebar.spec.ts` : assertions de rôle GUEST/MODERATOR/ADMIN conditionnées aux variables `E2E_CLERK_EMAIL`, `E2E_CLERK_PASSWORD`, `E2E_AUTHENTICATED_SERVER_PATH`, `E2E_EXPECTED_ROLE`.
- **Limitation connue** : Le bypass `424242` de Clerk ne fonctionne pas avec les comptes Google OAuth — uniquement avec des comptes email/password natifs Clerk. À résoudre via un compte de test dédié ou l'API Clerk backend.

#### Variables `.env` ajoutées pour les tests e2e

```
E2E_AUTHENTICATED_SERVER_PATH=/servers/<server-id>
E2E_EXPECTED_ROLE=GUEST
E2E_CLERK_EMAIL=<email-compte-test>
E2E_CLERK_PASSWORD=<mot-de-passe-compte-test>
```

#### Validation au 3 mai 2026

- `npm run lint` : OK
- `npx tsc --noEmit` : OK
- `npm run test:unit` : OK (18/18)
- `npm run test:e2e` : OK (3 passés, 2 skipped — le scénario GUEST authentifié est en attente d'un compte test natif Clerk)

### Règles Prisma 7 + Neon validées

- Ne pas définir `url` dans le bloc `datasource` de `schema.prisma`.
- Définir l'URL de migration dans `prisma.config.ts`.
- Utiliser `DIRECT_URL` pour Prisma Migrate (`prisma migrate dev`).
- Utiliser `DATABASE_URL` (pooler Neon) pour le runtime applicatif.
- Sur Neon/PostgreSQL, privilégier les clés étrangères natives (pas `relationMode = "prisma"` sauf besoin spécifique).

---

## Utilisation de ce fichier dans VSCode

Au début de chaque session Copilot Chat dans VSCode, référence ce fichier :
```
#file:COPILOT_CONTEXT.md
```
Cela permet à Copilot d'avoir immédiatement tout le contexte du projet sans avoir à tout réexpliquer.

---

## Phase d'optimisation (post-tuto)

Une fois le tutoriel terminé dans son intégralité, une **phase d'optimisation complète** sera menée. Elle couvrira notamment :

### Performance & architecture
- Éliminer les doubles requêtes DB (ex: layout + sidebar interrogent chacun le serveur)
- Mutualiser les fetch avec React cache ou des fonctions utilitaires partagées
- Auditer et réduire les waterfalls de requêtes dans les layouts imbriqués

### Qualité du code
- Harmoniser le nommage `imageURL` vs `imageUrl` dans le schéma Prisma (migration)
- Ajouter la validation serveur Zod sur toutes les routes API (POST /api/servers et suivantes)
- Remplacer les rafraîchissements bruts (`router.refresh()` + `window.location.reload()`) par une navigation ciblée
- Supprimer les variables calculées mais non consommées (textChannels, audioChannels, etc. dans server-sidebar, le temps du tuto)

### Tests
- Augmenter la couverture de tests unitaires sur les composants critiques
- Ajouter des tests e2e sur les flows principaux (création serveur, navigation, messages)

### Sécurité
- Audit OWASP des routes API (validation input, autorisation, rate limiting)
- Vérifier l'exposition des données Prisma retournées au client

### Dette technique cumulée pendant le tuto
Chaque dette identifiée en cours de route est documentée ici et sera traitée lors de cette phase.

### Engagement fin de tutoriel
À la fin du tutoriel, une **phase de tests complète** sera systématiquement menée (unitaires, intégration, e2e, accessibilité et non-régression) avant passage en branche suivante.
