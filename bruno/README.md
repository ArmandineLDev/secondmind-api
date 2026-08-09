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
| `inbox` | Capture rapide, tri hebdomadaire, passage sur un board (§3.9) |
| `crm` | Entreprises, contacts, opportunités, interactions, liens sociaux |
| `finance` | Budget, dépenses, temps, factures |
| `marketing` | Canvas hybride, SWOT, VP Canvas, offres, personas, objectifs, calendrier |
| `stats` | Les 7 vues PostgreSQL |
| `documents` | Liste des documents (lancé automatiquement) |
| `collections` | « Mes fiches » : colonnes, entrées, changement de type, purge (§3.7) |
| `settings` | Préférences, accès clients |
| `client` | Espace client (à lancer connecté **en tant que client**) |
| `zz-documents-manuel` | Upload / URL signée / suppression — **à la main**, écrit réellement sur Scaleway |
| `zz-securite-manuel` | Vérification du rate-limiting — **à la main**, à répéter jusqu'au 429 |
| `zz-cloisonnement-client` | Cloisonnement vu depuis un **compte client** — **à la main**, remplace la session |
| `zz-inscription-manuel` | `POST /api/v1/signup` — **à la main**, laisse des comptes en base (nettoyage SQL fourni) |
| `zz-workspaces-manuel` | Sélecteur d'espace de travail — **à la main**, change l'espace actif de la session |
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
- `zz-inscription-manuel/*` — crée de vrais comptes et **ne peut pas nettoyer derrière lui** :
  aucune route ne supprime un compte (cf. `docs/rgpd.md` §5). C'est la seule entorse à la règle
  « chaque dossier nettoie ses données ». Les adresses sont préfixées `bruno-signup+` et
  horodatées, ce qui rend le dossier rejouable et le nettoyage sûr :

  ```sql
  -- Les organisations D'ABORD : c'est l'adhésion qui permet de les retrouver,
  -- et elle disparaît avec le compte. La suppression cascade sur project et kanban_column.
  DELETE FROM "organization" o
   WHERE o.id IN (
     SELECT m."organizationId" FROM "member" m
       JOIN "user" u ON u.id = m."userId"
      WHERE u.email LIKE 'bruno-signup+%@exemple.test'
   );
  DELETE FROM "user" WHERE email LIKE 'bruno-signup+%@exemple.test';
  ```

  ⚠️ La requête `11` **remplace la session courante** par celle du compte de test. Relancer le
  dossier `auth` ensuite pour revenir sur le compte habituel.
- `zz-workspaces-manuel/*` — la requête `04` **change l'espace de travail de la session** ; la `06`
  la remet en place, ne pas interrompre le dossier entre les deux. Pour que le dossier ait un sens,
  il faut **appartenir à deux espaces** : depuis un second compte, inviter l'adresse de `TEST_EMAIL`
  via Paramètres → Accès clients. La requête `01` prévient dans la console si ce n'est pas le cas,
  et la `07` ne se joue qu'à la main, entre une déconnexion et une reconnexion.

  ⚠️ La déduplication du slug — le cœur du correctif — **ne se voit pas sur la réponse HTTP**,
  qui ne renvoie pas le slug. Après le passage du dossier :

  ```sql
  SELECT name, slug FROM "organization" WHERE name LIKE '[Bruno]%' ORDER BY "createdAt";
  -- attendu : mon-studio, puis mon-studio-2
  SELECT count(*) FROM "user" u LEFT JOIN "member" m ON m."userId" = u.id WHERE m.id IS NULL;
  -- attendu : 0 — aucun compte sans organisation, c'est LE test du correctif
  ```
- `client/*` — reste dans le run automatique, mais teste désormais l'inverse : **connecté en
  owner, ces 4 routes doivent répondre 403**. Le versant « un client ne voit que ses projets »
  est dans `zz-cloisonnement-client`.
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
| `inbox/03-snooze` | Une tâche différée doit disparaître du tri jusqu'à sa date |
| `inbox/12-refus-colonne-etrangere` | Poser une tâche sur la colonne d'un autre projet doit être refusé |
| `crm/13-get-opportunity` | Calcul `weighted_value` + jointures contact/entreprise |
| `client/04-client-document-url` | Doit répondre 404 sur un document d'un autre client |

## Limites connues

**Bruno valide l'API, pas l'application.** C'est un client HTTP : ni JavaScript, ni politique de
sécurité de navigateur, ni rendu. Une route peut être verte ici et parfaitement inutilisable depuis
l'interface — c'est arrivé le 2026-08-04 avec `PATCH` absent de la configuration CORS, qui rendait
six routes inaccessibles au navigateur alors qu'elles passaient toutes ici.

Échappent notamment à cette collection : le CORS, les cookies (`SameSite`, domaines croisés),
l'hydratation SSR, et tout le comportement d'interface. Détail et règle à suivre dans
`docs/tests.md` § « Ce que la collection Bruno ne peut pas tester ».

**Cloisonnement client** : les assertions du dossier `client/` vérifient que l'owner est refusé.
Le versant « un client ne voit que ses projets » exige un vrai compte client — dossier
`zz-cloisonnement-client`, à lancer à la main.
