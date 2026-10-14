# Restaurer une version précédente

## En urgence : revenir au déploiement précédent (1 minute)

Cloudflare → projet Pages → **Deployments** → choisir le dernier déploiement sain →
**Rollback to this deployment**. Le site revient immédiatement à cette version ; le dépôt, lui,
n'a pas changé : passer ensuite à l'étape suivante, sinon la prochaine fusion republiera le
problème.

## Annuler la modification dans le dépôt

1. Repérer la fusion fautive : `git log --oneline --merges main` ou l'historique des pull
   requests sur GitHub.
2. Sur GitHub, ouvrir la pull request fusionnée → **Revert** : GitHub prépare une pull request
   d'annulation. (En ligne de commande : `git switch -c fix/annule-xxx main`, puis
   `git revert -m 1 <commit-de-fusion>`, push, pull request.)
3. Attendre la CI verte, fusionner : la version corrigée est déployée.

## Retrouver un contenu supprimé

Chaque fichier a son historique : `git log --all -- src/content/acteurs/<slug>.md`, puis
`git show <commit>^:src/content/acteurs/<slug>.md > src/content/acteurs/<slug>.md`, commit
`content: restaure la fiche <slug>` et pull request.
