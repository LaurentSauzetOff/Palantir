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
| **Auth** | Clerk (dernière version) | À installer |
| **ORM** | Prisma v6 | À installer |
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
| Prisma | v4 | v6 | Syntaxe client modifiée |
| Uploadthing | v4 | v7+ | Composants entièrement refaits |
| shadcn/ui | ancienne CLI | nouvelle CLI | Commande d'install différente |
| Next.js | 13 | 16 | App Router, Server Actions évoluées |

---

## Utilisation de ce fichier dans VSCode

Au début de chaque session Copilot Chat dans VSCode, référence ce fichier :
```
#file:COPILOT_CONTEXT.md
```
Cela permet à Copilot d'avoir immédiatement tout le contexte du projet sans avoir à tout réexpliquer.
