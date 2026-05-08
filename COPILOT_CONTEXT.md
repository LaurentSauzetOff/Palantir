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

#### Audit de sécurité (3 mai 2026)

##### Contexte Next.js 16 — `proxy.ts` (pas `middleware.ts`)

Dans cette version de Next.js, la convention de fichier middleware a été renommée : `middleware.ts` est déprécié, le fichier s'appelle désormais `proxy.ts`. C'est documenté dans `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.

##### Problèmes identifiés et corrigés

- **`invite-code/route.ts` exposait l'objet server complet** : La réponse retournait `NextResponse.json(server)` au lieu de `NextResponse.json({ inviteCode: server.inviteCode })`. Corrigé — seul le champ nécessaire est retourné.
- **`messageFile` upload sans limites** : `f(["image", "pdf", "text"])` sans `maxFileSize` ni `maxFileCount` laissait la possibilité d'uploader des fichiers arbitrairement grands. Corrigé — limites ajoutées : image 4 MB, PDF 16 MB, texte 1 MB.

##### Dépendances vulnérables (non bloquant, à traiter post-tuto)

| Package | Sévérité | Advisory | Action |
|---|---|---|---|
| `effect` (via `uploadthing`) | **High** | GHSA-38f7-945m-qr2g — `AsyncLocalStorage` context leak | Fix = downgrade `uploadthing@6.12.0` (breaking change) |
| `postcss` (via `next`) | Moderate | GHSA-qx2v-qp2m-jg93 — XSS via `</style>` | Pas de fix sans downgrade Next.js |

##### Points validés sans action requise

- `proxy.ts` actif avec `auth.protect()` global (toutes routes protégées par Clerk au niveau middleware)
- Auth Clerk présente sur chaque route API via `getCurrentProfile()`
- Upload Uploadthing protégé par `handleAuth()` (throw si non authentifié)
- `inviteCode` généré par UUID v4 (non prédictible)
- Accès serveur filtré sur `members.some.profileId` (non-membres redirigés)
- `.env` absent du dépôt (couvert par `.env*` dans `.gitignore`)
- `e2e/.auth/` ignoré par git (cookies de session non versionnés)
- Pas d'injection SQL possible (toutes les requêtes passent par Prisma ORM)
- `imageUrl` validée comme URL via Zod avant écriture en base
- `remotePatterns` Next.js restreints à `uploadthing.com` et `ufs.sh`

#### Validation au 3 mai 2026

- `npm run lint` : OK
- `npx tsc --noEmit` : OK
- `npm run test:unit` : OK (18/18)
- `npm run test:e2e` : OK (3 passés, 2 skipped — le scénario GUEST authentifié est en attente d'un compte test natif Clerk)

### Mise à jour branche `feat/server-channels-sidebar` (4 mai 2026)

#### Nouveaux composants créés

- **`components/server/server-channel.tsx`** : Item de canal dans la sidebar. Bouton de navigation, icône selon `ChannelType`, boutons Edit/Delete visibles au hover pour ADMIN/MODERATOR.
- **`components/server/server-member.tsx`** : Item de membre dans la sidebar. Avatar, icône de rôle, navigation vers `/conversations/${member.id}`.
- **`components/server/server-section.tsx`** : En-tête de section avec bouton "+" (Create Channel) pour ADMIN/MODERATOR et "⚙" (Manage Members) pour ADMIN uniquement. Passe le `channelType` au store modal.

#### Modifications de composants existants

- **`components/server/server-sidebar.tsx`** : Assemblage complet de toutes les sections. La liste Members exclut l'utilisateur courant (`member.profileId !== profile.id`). La section Text Channels est toujours rendue (pour rendre visible le bouton "Create Channel"). Audio/Video/Members sont conditionnels.
- **`components/modals/create-channel-modal.tsx`** : Reçoit le `channelType` depuis le store modal et pré-sélectionne le type dans le formulaire via `useEffect`. Correction : suppression du `<FormControl>` en double autour de `<SelectTrigger>`.
- **`hooks/use-modal-store.ts`** : Ajout de `channelType?: ChannelType` dans `ModalData`.
- **`types.ts`** : Passage en `import type` pour les types Prisma (évite le bundle runtime côté client).
- **`components/navigation/navigation-item.tsx`** : Correction Tailwind v4 — `rounded-6` → `rounded-[24px]`, `rounded-4` → `rounded-[16px]`.
- **`components/server/server-search.tsx`** : Correction `useRouter` — `next/router` → `next/navigation` (App Router).

#### Routes API

- **`app/api/channels/route.ts`** (POST) : Validation Zod ajoutée (`createChannelSchema` — nom trimé, min 1, max 64, interdit "general" insensible à la casse, type enum `ChannelType`).
- **`app/api/channels/[channelId]/route.ts`** (PATCH + DELETE) : **Nouveau fichier.** Helper `getAuthorizedChannel()` vérifie le rôle ADMIN/MODERATOR. `updateChannelSchema` pour PATCH. Protection du canal "general" contre la suppression. Paramètre `channelId` via `await params` (Next.js 16).

#### Corrections de bugs

- `next/router` utilisé dans `server-search.tsx` (App Router requiert `next/navigation`).
- Import Prisma runtime dans un composant client → passage en `import type` + enums depuis `/lib/generated/prisma/enums`.
- Erreur d'hydratation : `<div>` imbriqué dans `<p>` dans `server-channel.tsx` → déplacé hors du `<p>`.
- Route `channels/route.ts` utilisée pour PATCH/DELETE → création de la route dynamique `[channelId]/route.ts`.
- Dépendance `@testing-library/dom` absente explicitement → ajoutée dans `devDependencies`.

#### Dette UI identifiée lors de la revue (non appliquée)

| # | Fichier | Ligne | Problème | Priorité |
|---|---|---|---|---|
| 1 | `server-channel.tsx`, `server-member.tsx`, `server-search.tsx` | 34, 30, 45/49 | Navigation vers des routes non encore implémentées (channel page, conversations) → risque de 404 | Bloquant à implémenter |
| 2 | `server-channel.tsx` | 54, 57 | Boutons Edit/Delete uniquement visibles au hover → non accessibles clavier/mobile | Post-tuto |
| 3 | `server-section.tsx` | 33, 44 | Boutons icon-only sans `aria-label` explicite | Post-tuto |
| 4 | `user-avatar.tsx` | 11 | `AvatarFallback` absent → image cassée ou manquante donne un avatar vide | Post-tuto |
| 5 | `server-sidebar.tsx` vs `server-search.tsx` | — | Incohérence : Search inclut tous les membres, la liste Members exclut l'utilisateur courant | Post-tuto |
| 6 | `server-channel.tsx` | 36 | Typo de classe CSS : `md-1` au lieu de `mb-1` | Mineur |
| 7 | `create-channel-modal.tsx` vs `channels/route.ts` | — | Validation client case-sensitive (`name !== "general"`), serveur case-insensitive (`toLowerCase()`) | Mineur |

#### Validation au 4 mai 2026

- `npm run lint` : OK (0 erreur, 0 warning)
- `npx tsc --noEmit` : OK
- `npm run build` : OK
- `npm run test:unit` : OK (18/18)

### Revue de branche `feat/channel-id-page` (5 mai 2026)

#### Décision de suivi

- Le chapitre est considéré comme terminé fonctionnellement.
- Les écarts relevés ci-dessous sont **conservés en l'état** pour l'instant et serviront de base de vérification lors de la phase d'optimisation post-tuto.
- **Action fin de tuto** : revenir sur l'ensemble de la partie design mobile (navigation, sidebars, toggle, responsive UI/UX) pour harmonisation globale.
- **Action fin de tuto** : déplacer `SocketProvider` du layout racine `app/layout.tsx` vers le layout `app/(main)/(routes)/layout.tsx` pour ne pas initier la connexion WebSocket sur les pages publiques (auth, setup).
- **Action fin de tuto** : migrer l'implémentation Socket.io vers un serveur Node.js standalone séparé (`server.js`) au lieu du hack Pages Router `pages/api/socket/io.ts`. L'approche du tuto (2023/Next.js 13/Webpack) est incompatible avec Next.js 16 + Turbopack : le transport polling reçoit des 400, le WebSocket pur échoue en dev. En production (sans Turbopack) ça peut fonctionner partiellement, mais l'architecture correcte 2026 est un process Socket.io indépendant.

#### Écarts techniques/UI/UX à revalider ensuite

- **Blocant TypeScript** : `app/(main)/(routes)/servers/[serverId]/conversations/[memberId]/page.tsx` existe mais est vide (fichier non modulaire), ce qui casse `npx tsc --noEmit`.
- **Blocant tests typés** : `components/server/server-sidebar.test.tsx` contient des accès `props` insuffisamment typés (erreurs TS sur usage de `in` + `unknown`).
- **Placeholder en prod** : `app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx` affiche actuellement `Contenu fake`.
- **Durcissement API members à compléter** : `app/api/members/[memberId]/route.ts` n'applique pas encore de validation stricte du champ `role` (retours métier potentiellement en 500 au lieu de 400).
- **Feedback utilisateur manquant dans modales** : erreurs encore journalisées en console sans retour UI dans `members-modal.tsx`, `edit-channel-modal.tsx`, `delete-channel-modal.tsx`.
- **Incohérences de validation Create/Edit channel** : `edit-channel-modal.tsx` reste moins stricte que `create-channel-modal.tsx` (trim/max/case-insensitive à aligner).
- **Micro-dette UI** : typo de classe `itemx-center` dans `delete-channel-modal.tsx`.
- **Accessibilité** : trigger icône seule dans `members-modal.tsx` à renforcer (libellé explicite et ergonomie action menu).
- **Cohérence de langue UI** : mélange FR/EN à harmoniser dans les surfaces d'administration membres/channels.

#### Validation au 5 mai 2026

- `npm run lint` : OK
- `npx tsc --noEmit` : KO (4 erreurs connues sur page conversation vide + typings test sidebar)

---

### Refactoring branche `refactor/socketio-implementation` (7 mai 2026)

#### Contexte
L'implémentation Socket.io du tuto (2023) utilisait un hack Pages Router (`pages/api/socket/io.ts`) incompatible avec Next.js 16 + Turbopack. Cette branche remplace cette approche par l'architecture moderne recommandée dans la documentation officielle Socket.io : serveur HTTP Node.js standalone.

#### Fichiers créés
- **`server.js`** (racine) : serveur HTTP Node.js standalone intégrant Next.js (`next()`) et Socket.io (`new Server(httpServer)`). Lancé via `node server.js`. Reste en `.js` car exécuté directement par Node sans compilateur TypeScript.
- **`app/socket.ts`** : singleton client Socket.io (`io({ autoConnect: false })`). Marqué `"use client"`, importé dans le provider. En `.ts` car compilé par Next.js/bundler.

#### Fichiers supprimés
- **`pages/api/socket/io.ts`** : ancien handler Pages Router — obsolète.

#### Fichiers modifiés
- **`package.json`** : scripts `dev` et `start` pointent sur `node server.js`. Ajout de `"type": "module"` (supprime le warning Node.js `MODULE_TYPELESS_PACKAGE_JSON`).
- **`components/providers/socket-provider.tsx`** : utilise le singleton `app/socket.ts` au lieu de créer une instance par render. Les listeners sont enregistrés avant `socketInstance.connect()` pour garantir que l'événement `connect` n'est jamais raté. Nettoyage strict avec références de fonctions (`off(event, handler)`).
- **`components/mobile-toggle.tsx`** : suppression du `asChild` sur `SheetTrigger` (causait un mismatch d'hydratation React entre le `<button>` Button et le `<span>` Avatar). Le trigger est maintenant un élément natif stylé directement.
- **`types.ts`** : suppression de `NextApiResponseServerIo` (dépendait de l'ancien handler Pages Router, plus utile).

#### Bugs corrigés
- **Mismatch d'hydratation** : `MobileToggle` → `SheetTrigger asChild` + `Button` générait un arbre HTML différent côté serveur et client. Résolu en retirant `asChild` et en stylant le trigger directement.
- **Build error `server-only` depuis un Client Component** : transformer `MobileToggle` en Client Component avait tiré la chaîne `server-sidebar → current-profile → auth()` côté navigateur. Résolu en maintenant `MobileToggle` comme Server Component.
- **SocketIndicator bloqué sur "Connecting..."** : l'événement `connect` était émis avant l'enregistrement des listeners (singleton déjà connecté au moment du `useEffect`). Résolu avec `autoConnect: false` + `socketInstance.connect()` après enregistrement des handlers + guard `if (socketInstance.connected)` pour l'état initial.

#### Architecture résultante
```
node server.js
 ├── Next.js (App Router, SSR, API routes)
 └── Socket.io server attaché au même port (3000)
      └── Client : app/socket.ts (singleton, autoConnect: false)
           └── SocketProvider : gère connect/disconnect/connect_error
                └── useSocket() → SocketIndicator, hooks métier futurs
```

#### Note pour la suite — émission d'événements depuis les routes API
Quand les routes API devront émettre des événements socket (ex : notifier les clients d'un nouveau message), l'instance `io` de `server.js` devra être exportée via un module singleton (ex: `lib/socket-io.ts`), car elle n'est pas accessible autrement depuis les routes App Router.

---

### Branche `feat/chat-input-component` (7 mai 2026)

#### Nouveau composant créé

- **`components/chat/chat-input.tsx`** : composant de saisie de message. Formulaire contrôlé avec `react-hook-form` + validation Zod (`content` min 1 char). Soumission via `axios.post` sur une `apiUrl` dynamique composée avec `query-string` (supporte les contextes channel et conversation via la prop `type`). État `disabled` pendant la soumission (`isSubmitting`). Placeholder adaptatif : `Message #canal` ou `Message utilisateur`. Boutons stub pour l'attachement de fichier (Plus) et le sélecteur d'emoji (Smile), non encore câblés.

#### Notes pour la suite
- Le bouton Plus (attachement fichier) et le bouton Smile (emoji picker) sont des stubs visuels — à brancher lors des chapitres upload et emoji du tuto.
- La route API cible (`apiUrl`) sera définie par la page parente selon le contexte (channel ou conversation).

---

### Branche `feat/messages-api` (7 mai 2026)

#### Nouveaux fichiers créés

- **`app/api/messages/route.ts`** : route App Router `POST /api/messages`. Remplace le handler Pages Router du tuto (`pages/api/socket/messages.ts`). Valide `serverId`, `channelId`, `content`. Vérifie l'appartenance au serveur et l'existence du canal avant écriture. Retourne 201 avec le message complet (membre + profil inclus). Émet l'événement `chat:{channelId}:messages` via `getIo()` après persistance en base.
- **`lib/socket-io.ts`** : singleton `globalThis.__socketio` pour partager l'instance Socket.IO Server entre `server.js` et les routes App Router (un `let` module-level ne suffit pas car Next.js bundle les routes dans des contextes séparés).

#### Fichiers modifiés

- **`server.js`** : assignation de `globalThis.__socketio = io` après création du serveur Socket.IO.
- **`app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`** : correction de l'`apiUrl` — `/api/socket/messages` (chemin Pages Router du tuto) → `/api/messages`.

#### Fichiers supprimés

- **`lib/current-profile-pages.ts`** : helper Pages Router (prenait un `NextApiRequest` pour Clerk). Devenu inutile, toutes les routes utilisent désormais `getCurrentProfile()` (App Router).

#### Bug corrigé

La version tuto avait un `try/catch` en dehors du handler `export default function handler(...)`, ce qui le rendait inopérant. Corrigé dans la réécriture App Router.

---

### Mise à jour branche `feat/message-attachment` (7 mai 2026)

#### Bug observé

- Envoi d'un PDF fonctionnel (fichier bien enregistré en base), mais erreur réseau côté client sur : `GET /_next/image?...` avec statut **400 Bad Request**.
- Cause racine : la détection du type de fichier reposait sur l'extension de l'URL (`split(".").pop()`).
- Les URLs Uploadthing (`*.ufs.sh`) ne contiennent pas toujours l'extension (`.pdf`), ce qui faisait passer certains PDF dans `next/image` par erreur.

#### Correctif appliqué

- Fichier modifié : **`components/file-upload.tsx`**.
- Changement de stratégie : détection basée sur `endpoint` et non sur l'extension d'URL.
- Si `endpoint === "serverImage"` : prévisualisation via `next/image` conservée.
- Pour `messageFile` : rendu en lien fichier générique (icône + "Ouvrir le fichier"), sans optimisation image Next.

#### Résultat

- Plus d'appel `/_next/image` pour les pièces jointes PDF/textes.
- Plus de 400 lié à l'optimizer d'image dans ce flow.
- Upload et persistance DB inchangés.

#### Décision produit actuelle

- Conserver ce comportement simple pour l'instant (pas de preview image dédiée sur `messageFile`).
- Évolution possible plus tard : brancher une détection MIME fiable (retour Uploadthing) pour afficher un preview uniquement quand le fichier est une vraie image.

---

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
- Ajouter une validation stricte de `role` sur les routes `PATCH /api/members/[memberId]` (enum Prisma + réponse 400 propre au lieu d'un 500)
- Remplacer les rafraîchissements bruts (`router.refresh()` + `window.location.reload()`) par une navigation ciblée
- Réduire les refresh redondants dans la modal de gestion des membres (`router.refresh()` + réinjection de `response.data` dans le store)
- Remplacer les `console.log(error)` côté client par un vrai feedback utilisateur (toast, message inline, état d'erreur)
- Supprimer les castings non sûrs du store modal (`data as { server: ... }`) en passant à un typage discriminé par type de modal
- Supprimer les variables calculées mais non consommées (textChannels, audioChannels, etc. dans server-sidebar, le temps du tuto)

### UI / UX
- Améliorer l'accessibilité des actions icon-only (ex: trigger `MoreVertical` dans la modal members) : vrai bouton, `aria-label`, focus visible, hit-area plus généreuse
- Stabiliser les états de chargement dans la modal members : éviter la disparition brutale des actions, préférer une désactivation locale avec feedback visuel en place
- Ajouter un `AvatarFallback` robuste dans `UserAvatar` (initiales / fallback visuel si image cassée ou absente)
- Uniformiser la langue de l'interface d'administration serveur (éviter le mélange anglais/français dans la même surface)
- Ajouter un vrai feedback utilisateur sur les erreurs d'actions de modération (kick, changement de rôle) au lieu d'un simple log console
- Améliorer la découvrabilité et l'ergonomie des actions contextuelles dans la modal members (menu d'actions plus explicite, cible de clic plus confortable)
- Vérifier les flows de mutation de la modal members directement dans le navigateur en phase post-tuto pour valider la perception UX réelle, pas seulement la structure du code

#### Audit UI/UX ciblé — chapitre channels/sidebar (4 mai 2026)

Constats à conserver pour traitement en fin de tutoriel :

- **Navigation vers conversations non implémentée** *(reste à faire)*
	- `components/server/server-member.tsx` et `components/server/server-search.tsx` redirigent vers `/servers/[serverId]/conversations/[memberId]`.
	- Tant que la page conversations n'existe pas, cela mène à des 404 depuis la sidebar/recherche.

- **Incohérence validation Create vs Edit channel** *(reste à faire)*
	- `create-channel-modal.tsx` applique `trim + max(64) + general case-insensitive`.
	- `edit-channel-modal.tsx` reste plus permissif (`name !== "general"` case-sensitive, sans trim/max).
	- Objectif post-tuto : aligner strictement les schémas client (et messages d'erreur) entre create/edit.

- **Feedback utilisateur sur erreurs des modales channels** *(reste à faire)*
	- `create-channel-modal.tsx`, `edit-channel-modal.tsx`, `delete-channel-modal.tsx` loggent encore en console sans retour visuel.
	- Objectif post-tuto : toast/inline error cohérent et actionnable.

- **Incohérence Search vs section Members** *(reste à faire)*
	- `ServerSearch` inclut tous les membres (y compris soi-même), la section Members de la sidebar exclut le profil courant.
	- Décider et appliquer une seule règle produit (inclure/exclure self) dans les deux vues.

- **Composant interactif principal de ligne channel** *(à revalider post-tuto)*
	- `server-channel.tsx` utilise un `div` avec `role="button"`.
	- Fonctionnel aujourd'hui, mais à comparer post-tuto avec une implémentation `button`/`Link` plus native selon le comportement final attendu.

- **Micro-dette visuelle dans modal de suppression channel** *(reste à faire)*
	- Typo CSS `itemx-center` dans `delete-channel-modal.tsx`.

- **Fallback avatar perfectible dans la liste membres** *(reste à faire)*
	- `UserAvatar` supporte désormais `fallback`, mais `server-member.tsx` ne lui passe pas encore les initiales du membre.

Points déjà traités pendant ce chapitre (ne plus considérer comme dettes ouvertes) :

- Accessibilité de base des actions Edit/Delete channel améliorée (vrais boutons + `aria-label` + stopPropagation).
- Correctif `md-1` -> `mb-1` appliqué dans `server-channel.tsx`.
- `AvatarFallback` réintroduit dans `UserAvatar`.

### Tests
- Augmenter la couverture de tests unitaires sur les composants critiques
- Ajouter des tests e2e sur les flows principaux (création serveur, navigation, messages)
- Ajouter des tests ciblés sur la gestion des membres : changement de rôle invalide, kick du owner refusé, membre introuvable, retour d'erreur utilisateur

### Sécurité
- Audit OWASP des routes API (validation input, autorisation, rate limiting)
- Vérifier l'exposition des données Prisma retournées au client
- Revoir les codes de retour des routes `members/[memberId]` : éviter les faux 200 silencieux et les 500 sur erreurs métier attendues (404/403/400 explicites)

---

## Audit UI/UX — état au 8 mai 2026

### 🔴 Accessibilité — critiques

#### 1. Focus ring désactivé (navigation clavier cassée)
Plusieurs inputs désactivent délibérément le focus visible :
- `components/chat/chat-input.tsx` — `focus-visible:ring-0` sur l'input de message
- `components/modals/edit-channel-modal.tsx` — `focus-visible:ring-0` sur l'input et `focus:ring-0` sur le select
- `components/modals/invite-modal.tsx` — `focus-visible:ring-0` sur l'input du lien

**Fix post-tuto :** remplacer par `focus-visible:ring-2 focus-visible:ring-ring`.

#### 2. Boutons Edit/Delete invisibles sur mobile
`components/server/server-channel.tsx` — les boutons Edit/Delete utilisent `md:opacity-0 md:group-hover:opacity-100`. Sur mobile (< 768px), ils sont masqués par défaut et le hover ne se déclenche jamais au touch.

#### 3. Labels d'inputs non reliés
`components/modals/invite-modal.tsx` — le `<Label>` et l'`<Input>` du lien d'invitation ne sont pas reliés (`htmlFor`/`id` manquants). Les lecteurs d'écran ne les associent pas.

#### 4. Aria-labels manquants
- Bouton delete dans `file-upload.tsx` (`<X />` sans `aria-label`)
- Bouton de téléchargement dans `chat-item.tsx` (`<DownloadIcon />` sans `aria-label`)
- Actions kick/changement de rôle dans `members-modal.tsx`

#### 5. Contraste insuffisant en dark mode
`components/navigation/navigation-sidebar.tsx` — `text-zinc-500` sur `#1E1F22` donne un ratio ≈ 3.5:1 (WCAG AA requiert 4.5:1).

---

### 🟠 Responsive — majeurs

#### 6. Images chat non adaptatives
`components/chat/chat-item.tsx` — `h-48 w-48` fixe. Sur écrans < 320px, débordement horizontal possible.
**Fix :** `h-48 w-48 max-h-[80vw] max-w-[80vw]`.

#### 7. Valeurs Tailwind non standards
- `components/chat/chat-welcome.tsx` — `h-18.75 w-18.75` (hors échelle Tailwind)
- `components/chat/chat-item.tsx` — `max-w-140` (Tailwind s'arrête à 96)

#### 8. Modales qui débordent sur très petits écrans
Les `DialogContent` ont un `max-w-sm` (384px) sans responsive inférieur. Sur écrans < 320px, débordement horizontal.

---

### 🟠 États manquants

#### 9. Aucun spinner sur les boutons en chargement
`components/modals/invite-modal.tsx` — le bouton "Generate a new link" est `disabled={isLoading}` mais sans indicateur visuel. L'utilisateur ne sait pas si l'action est en cours.

#### 10. Échecs silencieux à l'upload
`components/file-upload.tsx` — `onUploadError` fait uniquement `console.error`. L'utilisateur ne voit rien quand un upload échoue.

#### 11. Erreurs silencieuses dans les modales
`components/modals/edit-channel-modal.tsx`, `delete-channel-modal.tsx`, `create-channel-modal.tsx` — les `catch` loggent en console sans feedback visuel.

---

### 🔵 Cohérence visuelle

#### 12. Mélange FR/EN systématique 🚨
L'application mélange les deux langues sans cohérence :

| Composant | Texte anglais | Texte français |
|---|---|---|
| `invite-modal.tsx` | "Server invite link" | — |
| `chat-item.tsx` | "PDF File" | "Telecharger le fichier" |
| `chat-messages.tsx` | "Loading messages..." | — |
| `mobile-toggle.tsx` | "Open server navigation" | — |
| `emoji-picker.tsx` | — | "Ouvrir le sélecteur d'emoji" |

**Action post-tuto :** standardiser sur le français pour toute l'interface.

#### 13. Couleurs hexadécimales hardcodées
- `app/layout.tsx` — `dark:bg-[#313338]`
- `components/navigation/navigation-sidebar.tsx` — `dark:bg-[#1E1F22]`, `bg-[#E3E5E8]`

Impossible de changer le thème sans refactoring du code. Utiliser des variables CSS ou des tokens Tailwind sémantiques.

#### 14. Modales en fond blanc qui ignorent le dark mode
`create-server-modal.tsx`, `invite-modal.tsx`, `edit-channel-modal.tsx`, `members-modal.tsx` — tous utilisent `bg-white text-black`, ce qui casse la cohérence en dark mode.
**Fix :** utiliser `bg-card text-card-foreground` (tokens shadcn/ui).

---

### 🟡 UX — interactions & feedback

#### 15. Actions contextuelles inaccessibles au touch
`components/chat/chat-item.tsx` — les boutons Edit/Delete sont dans un `div` avec `hidden group-hover:flex`. Sur mobile, le hover ne se déclenche jamais → impossibilité d'éditer ou supprimer ses messages.

#### 16. Fausse affordance sur le nom d'auteur
`components/chat/chat-item.tsx` — le `<p>` du nom de membre a `hover:underline cursor-pointer` (apparence d'un lien) mais aucune action associée au clic.

#### 17. Validation de formulaire silencieuse
Dans `create-server-modal.tsx`, `create-channel-modal.tsx` — les erreurs Zod/RHF ne s'affichent pas via `<FormMessage />`. L'utilisateur soumet, rien ne se passe, sans explication.

---

### Actions prioritaires UI/UX (post-tuto)

| Priorité | Action | Fichier(s) |
|---|---|---|
| P0 | Rétablir focus rings | `chat-input.tsx`, `edit-channel-modal.tsx`, `invite-modal.tsx` |
| P0 | Rendre Edit/Delete accessibles au touch | `chat-item.tsx`, `server-channel.tsx` |
| P1 | Associer labels et inputs (`htmlFor`/`id`) | `invite-modal.tsx` et toutes modales |
| P1 | Ajouter aria-labels sur les boutons icon-only | `file-upload.tsx`, `chat-item.tsx`, `members-modal.tsx` |
| P1 | Ajouter feedback d'erreur (toast) sur uploads et actions modales | `file-upload.tsx`, modales |
| P1 | Standardiser la langue sur le français | tous les composants |
| P2 | Remplacer couleurs hex par variables CSS/tokens | `layout.tsx`, `navigation-sidebar.tsx` |
| P2 | Corriger les tailles Tailwind non standards | `chat-welcome.tsx`, `chat-item.tsx` |
| P2 | Afficher `<FormMessage />` dans tous les formulaires | toutes modales |
| P2 | Appliquer `bg-card text-card-foreground` aux modales | toutes modales |

---

## Audit expérience utilisateur — état au 8 mai 2026

### 🔴 Flux utilisateur — critiques

#### 1. Page d'invitation → écran blanc sur code invalide
`app/(invite)/(routes)/invite/[inviteCode]/page.tsx` — si le code d'invitation n'existe pas (serveur supprimé, code expiré), `prisma.server.update` lève une exception, le `catch` n'est pas présent, et la page retourne `null` → écran entièrement blanc sans message.
**Fix :** encapsuler dans un try/catch et rediriger vers `/` avec un message d'erreur.

#### 2. Double navigation après création de serveur
`components/modals/initial-modal.tsx` — après la soumission, le code fait `router.refresh()` suivi immédiatement de `window.location.reload()`. Sur réseau lent, c'est une race condition : l'utilisateur peut rester bloqué sur `/setup` si le refresh Next.js et le reload entrent en conflit.
**Fix :** remplacer les deux par `router.push(\`/servers/${server.id}\`)`.

#### 3. Modérateurs ne peuvent pas expulser de membres
`app/api/members/[memberId]/route.ts` — `DELETE` et `PATCH` filtrent avec `where: { id: serverId, profileId: profile.id }`, ce qui restreint l'opération au **propriétaire du serveur uniquement**. Les modérateurs voient les boutons d'action dans la modale membres mais les appels API échouent silencieusement (500 ou données inchangées).
**Fix post-tuto :** étendre l'autorisation aux MODERATOR pour `DELETE` ; garder ADMIN uniquement pour `PATCH role`.

---

### 🟠 Feedback et récupération d'erreur

#### 4. `sonner` installé mais jamais utilisé
`components/ui/sonner.tsx` est présent dans le projet, mais aucune modale ni action n'appelle `toast()`. Toutes les erreurs vont en `console.log/error`, tous les succès sont silencieux côté UI.

Cas concrets d'échecs silencieux :
- Création de serveur échouée → rien (`create-server-modal.tsx`)
- Regénération du lien d'invitation échouée → rien (`invite-modal.tsx`)
- Kick/changement de rôle échoué → rien (`members-modal.tsx`)
- Upload de fichier échoué → rien (`file-upload.tsx`)

**Action post-tuto :** brancher `toast.success()` / `toast.error()` dans tous les `catch` et après les actions critiques.

#### 5. Aucun retry possible après une erreur API
Quand un appel axios échoue dans une modale, le bouton reste dans son état précédent (ou `isLoading` reste bloqué), sans message et sans bouton "Réessayer". L'utilisateur doit fermer et rouvrir la modale.

#### 6. Pas de confirmation avant les actions destructives
`components/modals/members-modal.tsx` — un clic sur "Kick" expulse immédiatement le membre sans dialog de confirmation. Même chose pour le changement de rôle.
**Fix post-tuto :** `<AlertDialog>` de confirmation ("Êtes-vous sûr d'expulser X ?") avant les actions irréversibles.

---

### 🟠 Discoverabilité et permissions

#### 7. Actions masquées sans explication de permission
Un GUEST ne voit pas les boutons de modération — c'est correct — mais si par curiosité il cherche comment créer un canal ou inviter des gens, rien ne lui explique pourquoi ces options sont absentes. Aucun tooltip contextuel, aucun message "Seuls les admins peuvent faire ceci."

#### 8. Boutons icon-only sans tooltip
- Boutons Edit/Delete dans `server-channel.tsx`
- Bouton "+" (create channel) dans `server-section.tsx`
- Bouton download image dans `chat-item.tsx`
- Actions de rôle dans `members-modal.tsx`

Le composant `ActionTooltip` existe déjà et est utilisé ailleurs. Ces boutons auraient dû l'utiliser.

---

### 🟠 Continuité de session

#### 9. Socket non déconnectée au logout Clerk
`components/providers/socket-provider.tsx` ne réagit pas à l'événement de déconnexion Clerk. Si un utilisateur se déconnecte puis se reconnecte avec un autre compte, l'ancienne connexion socket peut persister temporairement → messages reçus sur le mauvais compte.

#### 10. Formulaires réinitialisés à la fermeture des modales
Comportement actuel : fermer une modale en cours de saisie (croix ou clic extérieur) réinitialise le formulaire sans avertissement. L'utilisateur perd ce qu'il avait commencé à taper.
Ce comportement est discutable — sur Discord, la saisie persiste. À décider lors de la phase post-tuto.

---

### 🟡 Cas limites non gérés

#### 11. Serveur sans canal — état vide non communiqué
Si tous les canaux sont supprimés, la sidebar affiche les headers de section ("Text Channels") mais vides, sans message "Aucun canal. Créez-en un !". L'utilisateur ne sait pas si c'est normal ou cassé.

#### 12. Canal sans messages — welcome seul, pas de guidage
`components/chat/chat-welcome.tsx` s'affiche quand il n'y a pas de messages, mais sans invitation explicite à envoyer le premier message (flèche vers l'input, texte d'appel à l'action).

#### 13. Upload annulé : état de prévisualisation figé
`components/file-upload.tsx` — si l'utilisateur annule un upload en cours (fermeture du navigateur, navigation), la prévisualisation blob reste affichée sans signal d'échec.

#### 14. Pagination de la liste des membres absente
`components/modals/members-modal.tsx` — tous les membres sont rendus en une seule liste `.map()` sans virtualisation ni pagination. Sur un serveur de 200+ membres, le rendu initial est bloquant.

---

### Actions prioritaires UX (post-tuto)

| Priorité | Action | Fichier(s) |
|---|---|---|
| P0 | Gérer le cas `null` sur la page invitation | `app/(invite)/(routes)/invite/[inviteCode]/page.tsx` |
| P0 | Remplacer double navigation par `router.push()` | `components/modals/initial-modal.tsx` |
| P1 | Brancher `toast.success()` / `toast.error()` partout | toutes les modales, `file-upload.tsx` |
| P1 | Ajouter confirmation `<AlertDialog>` avant kick/suppression | `members-modal.tsx`, `delete-server-modal.tsx`, `delete-channel-modal.tsx` |
| P1 | Ajouter `ActionTooltip` sur tous les boutons icon-only | `server-channel.tsx`, `server-section.tsx`, `chat-item.tsx`, `members-modal.tsx` |
| P1 | Étendre autorisation membres (MODERATOR peut kick) | `app/api/members/[memberId]/route.ts` |
| P2 | Déconnecter socket au logout Clerk | `components/providers/socket-provider.tsx` |
| P2 | Empty states pour sidebar sans canal et canal sans messages | `server-sidebar.tsx`, `chat-welcome.tsx` |
| P2 | Paginer ou virtualiser la liste membres | `members-modal.tsx` |

---

## Scénarios de panne à tester en fin de tuto

Ces trois cas ont été analysés lors de la mise en place de Socket.io. Ils sont volontairement non implémentés pour l'instant et seront mis à l'épreuve une fois le tutoriel terminé dans son intégralité.

### Cas 1 — Coupure réseau côté participant

**Symptôme** : un participant perd sa connexion internet en pleine visio.

**Comportement attendu** :
- Ne pas retirer le participant immédiatement à la déconnexion socket.
- Démarrer un timer de grâce côté serveur (20 à 45 secondes).
- Afficher un badge `X se reconnecte…` aux autres participants (pas `X a quitté`).
- Si reconnexion dans le délai : restaurer la session (salle, rôle, mute, caméra) sans bruit.
- Si timeout atteint : marquer `left`, notifier les autres, nettoyer les ressources.
- Ne pas spammer le chat de notifications join/leave sur les micro-coupures.

**Clés techniques** :
- `participantId` stable découplé de l'id socket.
- Idempotence des événements join/leave/rejoin.
- Timer de grâce géré côté `server.js` (pas côté client).

---

### Cas 2 — Coupure réseau côté admin/modérateur

**Symptôme** : l'admin (propriétaire du serveur ou modérateur) se déconnecte involontairement.

**Comportement attendu** :
- Le rôle admin est persistant en base (Prisma) — il ne doit jamais dépendre de la socket active.
- À la reconnexion, Clerk ré-authentifie l'utilisateur et ses droits sont rechargés depuis la DB.
- Fenêtre de grâce identique au Cas 1 : les droits sont restaurés automatiquement au retour.
- Si l'absence dépasse le timeout : promotion temporaire d'un modérateur de confiance (soft-host transfer), avec audit log.
- Certaines actions sensibles (expulsion, fermeture de room, changement de permissions globales) peuvent être gelées pendant l'absence admin (host lock).
- UX : badge `Admin en reconnexion…` (pas `Admin parti`). Au retour : prompt `Tu as retrouvé la connexion. Reprendre les contrôles ?`.

**Clés techniques** :
- Machine à états participant : `connected → reconnecting → temporarily-replaced → resumed → left-final`.
- Séparation stricte rôle persistant (DB) / présence volatile (socket).
- Traçabilité de toute promotion temporaire.

---

### Cas 3 — Panne de l'application elle-même

**Symptôme** : le serveur Node.js (`server.js`) ou la base de données tombe en prod.

**Comportement attendu** :
- Les clients affichent un état `Service indisponible, reconnexion en cours` (pas un écran blanc ou une erreur 500 nue).
- La reconnexion client tente un backoff exponentiel (géré nativement par Socket.io avec `reconnectionDelay`).
- Les sessions utilisateur et les rôles persistent en DB — pas de perte d'identité au redémarrage.
- Les opérations critiques sont idempotentes pour éviter les doublons après reprise.
- État minimal rejoué après redémarrage : rôle, canaux accessibles, dernier état connu.

**Prérequis production** :
- Plusieurs instances derrière un load balancer + adapter distribué Socket.io (Redis adapter) pour partager l'état socket entre instances.
- Probes de santé pour sortir une instance malade du trafic.
- Sauvegardes Neon + procédure de restauration testée.
- Monitoring + alerting en temps réel, runbook incident documenté.

**MVP acceptable** :
- Une seule instance + redémarrage automatique (`pm2` ou `systemd`).
- Reconnexion automatique Socket.io côté client avec backoff.
- Affichage d'un bandeau `Reconnexion en cours…` pendant l'indisponibilité.

### Dette technique cumulée pendant le tuto
Chaque dette identifiée en cours de route est documentée ici et sera traitée lors de cette phase.

### Optimisation vidéo chat (pistes ajoutées le 8 mai 2026)

- Générer les vidéos en **H.264 (MP4)** côté upload pour maximiser la compatibilité des navigateurs et limiter les coûts de transcodage ultérieurs.
- Mettre en place un streaming adaptatif **HLS multi-bitrate** pour ajuster dynamiquement la qualité selon le réseau (meilleur compromis qualité/fluidité/bande passante).
- Générer et servir une image **poster (thumbnail)** pour chaque vidéo afin d'éviter le décodage d'une frame vidéo au scroll et réduire la charge initiale côté client/serveur.

#### `app/api/channels/route.ts` — handlers `DELETE` et `PATCH` mal placés

`app/api/channels/route.ts` contient actuellement des handlers `DELETE` et `PATCH` qui déclarent un paramètre `params: Promise<{ channelId: string }>`, mais ce fichier est une route statique (aucun segment dynamique dans le chemin). Next.js ne peut jamais injecter `channelId` ici, et TypeScript le signale (erreur `TS2344` au niveau du validateur `.next/dev/types/validator.ts`).

**Fix à appliquer post-tuto :**
1. Créer `app/api/channels/[channelId]/route.ts` et y déplacer `DELETE` + `PATCH`.
2. Ajouter le check `profile` manquant dans ces deux handlers (ils ne l'avaient pas dans l'original).
3. Conserver `POST` dans `app/api/channels/route.ts` (route statique — `serverId` est passé en query param, pas dans le path).

#### `app/api/channels/route.ts` — `POST` sans validation Zod sur `type`

`const { name, type } = await req.json()` — le champ `type` est injecté directement dans Prisma sans validation. Si la valeur n'est pas un `ChannelType` valide, Prisma lève une erreur → 500 brut. Il faut valider via `z.enum(channelTypeValues)` avant d'écrire en base.

#### `app/api/channels/[channelId]/route.ts` (futur fichier) — `DELETE` et `PATCH` sans auth

Une fois déplacés dans le bon fichier, `DELETE` et `PATCH` devront inclure :
- `getCurrentProfile()` + guard 401
- Vérification que le profil est ADMIN ou MODERATOR sur le serveur auquel appartient le canal (actuellement absent — n'importe qui pourrait supprimer ou renommer un canal).

#### `components/modals/create-channel-modal.tsx` — label de log incorrect

```ts
console.error("[CREATE_SERVER_MODAL]", error); // copy-paste depuis create-server-modal
```
À corriger en `[CREATE_CHANNEL_MODAL]`.

#### `components/modals/create-channel-modal.tsx` — `<FormControl>` dupliqué dans le `<Select>`

Le champ `type` contient deux `<FormControl>` imbriqués : un autour du `<Select>` et un autour du `<SelectTrigger>`. shadcn/ui n'en attend qu'un seul par `<FormField>`. Supprimer le `<FormControl>` interne (celui autour de `<SelectTrigger>`).

---

### Mise à jour branche `feat/emojis-bar` (8 mai 2026)

#### Contexte
Extension du composant d'upload fichiers + implémentation du picker d'emoji dans le chat. L'incompatibilité de `@emoji-mart/react` avec React 19 a imposé une approche DOM impérative.

#### Fichiers modifiés

- **`app/api/uploadthing/core.ts`** : route `messageFile` étendue pour accepter images (PNG/JPEG/WebP/GIF), vidéos (MP4/WebM), audio (clé générique `audio`), archives (ZIP/RAR), PDF et texte. Les tailles respectent les paliers valides Uploadthing (puissances de 2 : `"8MB"`, `"16MB"`, `"32MB"`).

- **`components/file-upload.tsx`** : entièrement réécrit pour supporter tous les types de médias.
  - `EXTENSION_BADGES` : badges colorés par famille (bleu=images, violet=vidéo, emerald=audio, rose=archives, ambre=PDF, zinc=TXT) avec curseurs hover distincts.
  - `generateVideoThumbnail(file)` : capture à 10% de la durée via Canvas (JPEG 70%).
  - Preview blob pour images + thumbnail canvas pour vidéos ; state `uploadedFileType` ("image" | "video" | "other" | null).
  - Bouton "Choose a file" masqué en double couche (`content.button: () => null` + `appearance.button: "hidden !m-0 !p-0 !h-0 !w-0"`).
  - Détection basée sur `endpoint` (pas l'extension d'URL) pour décider du rendu post-upload.

#### Nouveaux composants créés

- **`components/emoji-picker.tsx`** : picker d'emoji compatible React 19.
  - `@emoji-mart/react` incompatible React 19 → non installé. Seules les dépendances `emoji-mart` + `@emoji-mart/data` sont utilisées.
  - Intégration via l'API DOM impérative : `new Picker({data, theme, onEmojiSelect})` monté dans un `div` via `useRef` + `appendChild`.
  - Panneau local absolu (pas de Popover Radix — 3 tentatives infructueuses : submit de form, effet avant montage, comportement instable avec rendu impératif).
  - Fermeture au clic extérieur via `containerRef` + listener `mousedown` sur `document`.
  - Theme adaptatif via `useTheme()` de `next-themes`.

- **`components/chat/chat-input.tsx`** (modifié) : intégration d'`EmojiPicker` dans le div de droite du champ de saisie. `onChange` insère l'emoji à la fin du champ courant.

#### Points techniques notés

- `"audio/wav"` et `"audio/mp3"` ne sont pas des clés valides dans Uploadthing v7 → clé générique `audio` utilisée.
- `"10MB"` invalide → corrigé en `"8MB"`.
- Picker emoji monté uniquement quand `open === true` (pas de montage à froid).

#### Décision d'architecture future — GifPicker Giphy

**Décision prise** : le support des GIFs Giphy sera ajouté via un **second bouton indépendant** dans `chat-input.tsx`, à côté du bouton EmojiPicker. Ce sera un composant `GifPicker` séparé (pas d'onglets dans EmojiPicker).

**Points d'implémentation à prévoir** :
- `GifPicker` : composant React client avec son propre panneau local absolu (même pattern qu'`EmojiPicker`).
- **Fermeture mutuelle** : éviter que les deux panneaux soient ouverts simultanément. Solution retenue : un state `openPicker: "emoji" | "gif" | null` dans `chat-input.tsx`, passé en props (`isOpen` + `onClose`) à chaque composant.
- **Clé API Giphy** : à stocker en variable d'environnement côté serveur uniquement. Les requêtes Giphy doivent passer par une **route API Next.js proxy** (`/api/giphy/search` ou similaire) — jamais exposer la clé côté client.
- Lib candidate : `@giphy/react-components` ou intégration manuelle via l'API Giphy REST.

---

### Mise à jour branche `feat/chat-messages-component` (8 mai 2026)

#### Contexte
Mise en place du socle de lecture des messages côté client avec pagination curseur (infinite query), et ajout de la route `GET /api/messages` côté serveur pour alimenter le flux.

#### Nouveaux composants / hooks

- **`components/providers/query-provider.tsx`** : provider React Query avec `QueryClientProvider` et instance stable (`useState(() => new QueryClient())`).
- **`hooks/use-chat-query.ts`** : hook de récupération paginée via `useInfiniteQuery`.
	- Construction de l'URL avec `query-string` (`cursor` + `paramKey` dynamique).
	- `getNextPageParam` basé sur `nextCursor` renvoyé par l'API.
	- `refetchInterval` conditionnel : `false` si socket connectée, `1000ms` sinon.
	- `initialPageParam` explicite pour compatibilité TanStack Query v5.
- **`components/chat/chat-welcome.tsx`** : bloc de bienvenue channel/conversation (empty state visuel).
- **`components/chat/chat-messages.tsx`** : composant de rendu du flux.
	- États de chargement/erreur (`Loader2`, `ServerCrash`).
	- Correction v5 : `status === "pending"` (et non `"loading"`).
	- Rendu des pages en ordre inversé (`flex-col-reverse`) + `ChatWelcome`.

#### Fichiers modifiés

- **`app/layout.tsx`** : insertion de `QueryProvider` dans l'arbre applicatif (autour des composants qui consomment React Query).
- **`app/(main)/(routes)/servers/[serverId]/channels/[channelId]/page.tsx`** : remplacement du placeholder "Future messages" par `ChatMessages` avec props complètes (`chatId`, `apiUrl`, `socketUrl`, `socketQuery`, `paramKey`, `paramValue`).
- **`app/api/messages/route.ts`** : ajout du handler `GET` en plus de `POST`.
	- Auth via `getCurrentProfile()`.
	- Validation de `channelId`.
	- Pagination curseur avec batch fixe (`MESSAGES_BATCH = 10`), tri `createdAt desc`.
	- Inclusion `member.profile` pour le rendu client.
	- Réponse standardisée `{ items, nextCursor }`.

#### Dépendances

- **`package.json` / `package-lock.json`** : ajout de `@tanstack/react-query`.

#### Points de vigilance

- Une entrée parasite `"root": "github:tanstack/react-query"` a été observée dans `package.json` durant l'installation. Cette clé n'est pas nécessaire pour le projet et doit être supprimée si encore présente avant merge.
- `ChatMessages` contient encore des props prévues pour la phase suivante (socket live updates / observer d'infinite scroll), ce qui peut générer des warnings lint temporaires de variables non utilisées tant que le chapitre n'est pas finalisé.

---

### Engagement fin de tutoriel
À la fin du tutoriel, une **phase de tests complète** sera systématiquement menée (unitaires, intégration, e2e, accessibilité et non-régression) avant passage en branche suivante.

---

## Audit qualité & modernité — état au 8 mai 2026

Score global estimé : **6.75 / 10**

### ✅ Points forts confirmés

- **Next.js 16 App Router** bien adopté : `params: Promise<{}>`, Server Components, `revalidatePath()` après mutations.
- **TypeScript strict** activé (`"strict": true` dans `tsconfig.json`).
- **ESLint v9 FlatConfig** (`eslint.config.mjs`) — format moderne.
- **Prisma + Neon adapter** — setup serverless correct via `@prisma/adapter-neon`.
- **Zod** sur toutes les routes API existantes.
- **Zustand** pour le store modal — léger et approprié.
- **TanStack Query v5** bien configuré (pagination curseur, `initialPageParam`, status `"pending"` v5).
- **Tests Vitest + Playwright** présents et configurés.
- **Uploadthing v7** correctement intégré (FileRouter typé, limites explicites).

---

### 🔴 Bloquants avant production

#### 1. Socket.io incompatible serverless
**Fichier** : `server.js` + `lib/socket-io.ts`
`globalThis.__socketio` n'est pas partagé entre les Lambdas Vercel. L'émission temps réel depuis les routes API (`getIo()`) ne fonctionnera jamais en prod. Les messages n'arrivent que via le fallback polling (1 s).
**Fix requis** : Redis adapter Socket.io ou HTTP relay dédié.

#### 2. Routes PATCH/DELETE messages absentes
Les boutons éditer/supprimer prévus dans `chat-item.tsx` (WIP) n'ont pas de routes API cibles. À implémenter.

#### 3. Memory leak Canvas dans FileUpload
`components/file-upload.tsx` — si une vidéo est corrompue, la Promise de génération de thumbnail ne se résout jamais et les event listeners (`loadedmetadata`, `seeked`) ne sont pas nettoyés.

---

### 🟠 Important (avant shipping)

#### 4. `imageURL` vs `imageUrl` — nommage incohérent
`prisma/schema.prisma` utilise `imageURL` (PascalCase), tout le code TypeScript utilise `imageUrl`. Fonctionnel mais source de confusion. À harmoniser via migration Prisma.

#### 5. TypeScript target ES2017 obsolète
`tsconfig.json` — à passer a minima à `"ES2020"` (support async/await optimisé, compatibilité Next.js 16).

#### 6. Error handling générique dans les routes API
Tous les `catch` font `console.log` + `"Internal error"` sans distinguer les erreurs Zod / Prisma / inconnues. À standardiser avec codes HTTP explicites (400/404/500).

#### 7. Race condition dans MembersModal
`router.refresh()` suivi immédiatement de `onOpen("members", { server: response.data })` : l'utilisateur voit brièvement l'ancienne liste. Migrer vers mutation TanStack Query.

#### 8. Pas de rate limiting sur `POST /api/servers`
Un utilisateur malveillant peut créer des milliers de serveurs sans limite. À ajouter via middleware ou librairie dédiée.

---

### 🟡 Mineurs / style

#### 9. Fragment importé depuis `react/jsx-runtime` (API interne)
`components/chat/chat-messages.tsx` — importer `Fragment` depuis `"react"` à la place.

#### 10. `useSyncExternalStore` utilisé comme hack SSR
`hooks/use-origin.ts` et `components/providers/modal-provider.tsx` utilisent ce hook pour détecter le montage côté client, alors que `useState` + `useEffect` est plus lisible et suffisant.

#### 11. Couleurs hex hardcodées dans la sidebar
`components/server/server-sidebar.tsx` — `dark:bg-[#2B2D31]` etc. À remplacer par des variables CSS/Tailwind pour une thématisation cohérente.

#### 12. Pas de `.env.example` dans le repo
Aucun fichier de référence pour les variables d'environnement. À créer pour faciliter l'onboarding.

#### 13. Socket.io client sans stratégie de reconnexion explicite
`app/socket.ts` — pas de `reconnectionDelayMax`, pas d'`auth` Clerk. À configurer avant production.

#### 14. Cursor pagination — vérifier comportement `skip: 1`
`app/api/messages/route.ts` — `skip: 1` avec `cursor` est le comportement attendu pour exclure le curseur lui-même (correct en Prisma v5+), mais à valider manuellement si des messages sont manquants ou dupliqués.

---

### Actions prioritaires (ordre de traitement post-tuto)

| Priorité | Action | Fichier(s) |
|---|---|---|
| P0 | Reconfigurer Socket.io pour serverless (Redis adapter) | `server.js`, `lib/socket-io.ts` |
| P0 | Implémenter PATCH/DELETE `/api/messages/[messageId]` | à créer |
| P0 | Corriger memory leak Canvas | `components/file-upload.tsx` |
| P1 | Harmoniser `imageURL` → `imageUrl` | `prisma/schema.prisma` + migrations |
| P1 | Passer TypeScript target à ES2020 | `tsconfig.json` |
| P1 | Standardiser error handling dans les routes API | tous `app/api/*/route.ts` |
| P2 | Ajouter rate limiting sur POST routes sensibles | middleware ou lib |
| P2 | Corriger import Fragment | `components/chat/chat-messages.tsx` |
| P2 | Créer `.env.example` | racine projet |

