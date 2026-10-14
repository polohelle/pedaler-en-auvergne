---
name: ouvrir-pr-contenu
description: Publier le travail d'un agent pour relecture — branche agent/<nom>/<date>, commit conventionnel, pull request avec résumé, liste des sources et points de doute. Utilisé par tous les agents ; jamais de fusion ni de push sur main.
---

# Ouvrir une pull request de contenu

## Étapes

```bash
git switch main && git pull --ff-only
git switch -c agent/<nom-de-l-agent>/<aaaa-mm-jj>
# … création ou modification des fichiers …
pnpm verify
git add src/content data docs/veille
git commit -m "content: <résumé court>"   # hooks actifs, jamais --no-verify
git push -u origin agent/<nom-de-l-agent>/<aaaa-mm-jj>
gh pr create --base main --title "<titre prévu par l'agent>" --body-file <fichier>
```

- Type de commit : `content:` pour des contenus ; `docs(veille):` pour une note de veille ;
  `fix(content):` pour une correction de fiche.
- Si la branche du jour existe déjà, y ajouter un commit plutôt que d'en créer une autre.
- `pnpm verify` doit passer avant le push ; en cas d'échec qu'on ne sait pas corriger, ne pas
  pousser et le dire dans le rapport.

## Corps de la pull request

Suivre `.github/pull_request_template.md`, cocher le type « Contenu », puis :

```markdown
## Résumé

<agent>, passage du <date> : N contenus proposés.

## Contenus

- `src/content/actus/2026-10-12-voie-verte-riom.md` — brève locale — source : <url>

## Sources consultées

- <nom> : <n> informations retenues / <n> écartées

## Points de doute

- <fichier> : <doute précis>

Ferme #<numéro> ← seulement pour une proposition du public
```

## Interdits

Ne jamais fusionner (`gh pr merge`), approuver sa propre pull request, pousser sur `main`,
forcer un push sur une branche qui n'est pas la sienne, ni fermer une issue.
