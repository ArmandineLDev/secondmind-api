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

5. Lancer le dossier **`auth`** en premier : la session est un cookie, toutes les autres
   requêtes en dépendent. Lancer ensuite les autres dossiers dans l'ordre voulu.

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
| `documents` | Liste des documents (lancé automatiquement) |
| `settings` | Préférences, accès clients |
| `client` | Espace client (à lancer connecté **en tant que client**) |
| `zz-documents-manuel` | Upload / URL signée / suppression — **à la main**, écrit réellement sur Scaleway |
| `zz-securite-manuel` | Vérification du rate-limiting — **à la main**, à répéter jusqu'au 429 |
| `zz-deconnexion` | Sign Out — **à lancer à la main uniquement**, il détruit la session |

## Chaînage automatique

Les requêtes se passent les identifiants entre elles via `vars:post-response` : un `POST`
capture l'`id` créé, les requêtes suivantes le réutilisent. Il n'y a **aucun UUID à copier-coller
à la main**.

Chaque dossier est autonome : il crée ses propres données de test (préfixées `[Bruno]`) et les
supprime en fin de parcours (`seq` 90+). Lancer un dossier entier avec *Run Folder* ne laisse
donc rien en base.

⚠️ Ne pas interrompre un run en cours de route : les requêtes de nettoyage ne passeraient pas
et des données `[Bruno]` resteraient en base.

⚠️ **`seq` doit commencer à 1** : Bruno n'honore pas `seq: 0` et relègue la requête en fin de
dossier — le chaînage des variables casse alors silencieusement.

⚠️ **Sign Out est isolé dans `zz-deconnexion/`** et ne doit jamais être lancé en automatique :
il détruit la session et tous les dossiers suivants tomberaient en 401.

## Requêtes non automatisables

Elles n'ont volontairement pas d'assertion bloquante et sont documentées dans leur onglet *Docs* :

- `zz-documents-manuel/*` — écrit réellement sur Scaleway. Le fichier d'exemple
  (`fixtures/exemple.pdf`, un PDF minimal de 595 octets) est committé. Le multipart exige
  **trois** champs : `file`, `name` et `type` — envoyer le fichier seul renvoie un 400.
- `settings/04-add-client`, `settings/05-assign-project` — exigent un compte client existant.
- `client/*` — à exécuter connecté avec un **compte client**, pas le compte owner.
- `auth/sign-up` — **doit échouer** (`disableSignUp: true`). Un 200 ici serait une régression.
- `auth/request-password-reset` — déclenche un **envoi Brevo réel** si le compte existe.
- `zz-deconnexion/sign-out` — détruit la session.
- `zz-securite-manuel/rate-limit-sign-in` — à envoyer en boucle jusqu'au 429 ; sans assertion,
  puisqu'un envoi isolé renvoie légitimement 401.

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
