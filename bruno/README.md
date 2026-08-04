# Collection Bruno — SecondMind API

Collection de tests d'API versionnée avec le code. [Bruno](https://www.usebruno.com/) stocke
chaque requête dans un fichier `.bru` en texte brut : la collection se relit en diff, se review
en PR, et suit les migrations du schéma.

## Mise en route

1. **Créer `bruno/.env`** (gitignoré) à partir de `.env.example` :

   ```
   TEST_EMAIL=votre-compte@exemple.dev
   TEST_PASSWORD=votre-mot-de-passe-local
   ```

   Ces identifiants ne doivent **jamais** être écrits en dur dans un `.bru` — ils y étaient
   jusqu'au 2026-08-03 et sont donc encore présents dans l'historique git.

2. Lancer l'API en local : `pnpm dev` (port 1974).

3. Dans Bruno : *Open Collection* → pointer sur `secondmind-api/bruno`.

4. Sélectionner l'environnement **local** en haut à droite.

5. Lancer **Auth → Sign In** en premier : la session est un cookie, toutes les autres
   requêtes en dépendent.

## Organisation

| Dossier | Contenu |
|---|---|
| `auth` | Connexion, session, `/api/me`, mot de passe oublié |
| `projects` | Projets, colonnes kanban, réordonnancement |
| `tasks` | Tâches, déplacement, dépendances, récurrence |
| `crm` | Entreprises, contacts, opportunités, interactions, liens sociaux |
| `finance` | Budget, dépenses, temps, factures |
| `marketing` | Canvas hybride, SWOT, VP Canvas, offres, personas, objectifs, calendrier |
| `stats` | Les 7 vues PostgreSQL |
| `documents` | Upload S3, URL signée (manuel) |
| `settings` | Préférences, accès clients |
| `client` | Espace client (à lancer connecté **en tant que client**) |

## Chaînage automatique

Les requêtes se passent les identifiants entre elles via `vars:post-response` : un `POST`
capture l'`id` créé, les requêtes suivantes le réutilisent. Il n'y a **aucun UUID à copier-coller
à la main**.

Chaque dossier est autonome : il crée ses propres données de test (préfixées `[Bruno]`) et les
supprime en fin de parcours (`seq` 90+). Lancer un dossier entier avec *Run Folder* ne laisse
donc rien en base.

⚠️ Ne pas interrompre un run en cours de route : les requêtes de nettoyage ne passeraient pas
et des données `[Bruno]` resteraient en base.

## Requêtes non automatisables

Elles n'ont volontairement pas d'assertion bloquante et sont documentées dans leur onglet *Docs* :

- `documents/02-upload-document` — exige un fichier dans `bruno/fixtures/` et écrit réellement
  sur Scaleway.
- `settings/04-add-client`, `settings/05-assign-project` — exigent un compte client existant.
- `client/*` — à exécuter connecté avec un **compte client**, pas le compte owner.
- `auth/sign-up` — **doit échouer** (`disableSignUp: true`). Un 200 ici serait une régression.

## Requêtes sentinelles

Certaines requêtes existent pour verrouiller un bug déjà survenu. Ne pas les supprimer :

| Requête | Régression couverte |
|---|---|
| `marketing/01-create-canvas` | Datamapper visant une table `canvas` inexistante — 500 sur tout le module, non détecté pendant des semaines |
| `marketing/02-create-canvas-empty-blocks` | Schéma de création refusant `null` sur les champs texte alors que le formulaire en envoie |
| `marketing/14-create-persona-minimal` | Même faille sur les personas |
| `crm/13-get-opportunity` | Calcul `weighted_value` + jointures contact/entreprise |
| `client/04-client-document-url` | Doit répondre 404 sur un document d'un autre client |

## Limite connue

Cette collection teste le **fonctionnel**, pas le **cloisonnement**. Tant que le P1 de la
Phase 11.5 (`docs/TODO.md`) n'est pas fait, un compte client authentifié peut appeler toutes
les routes `/api/v1` et recevoir 200. Les requêtes du dossier `client` sont le point de départ
pour vérifier ce correctif une fois qu'il sera posé.
