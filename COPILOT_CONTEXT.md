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

### Engagement fin de tutoriel
À la fin du tutoriel, une **phase de tests complète** sera systématiquement menée (unitaires, intégration, e2e, accessibilité et non-régression) avant passage en branche suivante.
