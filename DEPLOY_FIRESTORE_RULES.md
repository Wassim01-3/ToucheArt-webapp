# Guide pour déployer les règles Firestore manuellement

## Méthode 1 : Via Firebase Console (Recommandé - Plus simple)

### Étape 1 : Accéder à Firebase Console
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet ToucheArt

### Étape 2 : Accéder aux règles Firestore
1. Dans le menu de gauche, cliquez sur **"Firestore Database"**
2. Cliquez sur l'onglet **"Règles"** (Rules) en haut

### Étape 3 : Copier les règles
1. Ouvrez le fichier `firestore.rules` dans votre projet
2. Copiez **tout le contenu** du fichier

### Étape 4 : Coller et publier
1. Dans Firebase Console, remplacez tout le contenu de l'éditeur de règles
2. Collez le contenu copié depuis `firestore.rules`
3. Cliquez sur le bouton **"Publier"** (Publish) en haut à droite
4. Attendez la confirmation "Rules published successfully"

✅ **C'est tout !** Vos règles sont maintenant déployées.

---

## Méthode 2 : Via Firebase CLI (Pour les développeurs avancés)

### Prérequis
1. Installer Node.js (si pas déjà installé)
2. Installer Firebase CLI globalement :
   ```bash
   npm install -g firebase-tools
   ```

### Étape 1 : Se connecter à Firebase
```bash
firebase login
```
Cela ouvrira votre navigateur pour vous authentifier.

### Étape 2 : Initialiser Firebase (si pas déjà fait)
```bash
firebase init firestore
```
- Sélectionnez votre projet
- Utilisez le fichier `firestore.rules` existant (tapez "y" si demandé)

### Étape 3 : Déployer les règles et les index
```bash
# Déployer les règles
firebase deploy --only firestore:rules

# Déployer les index
firebase deploy --only firestore:indexes
```

Vous devriez voir :
```
✔  Deploy complete!
```

---

## Vérification

Pour vérifier que les règles sont bien déployées :

1. Retournez dans Firebase Console → Firestore Database → Rules
2. Vous devriez voir vos règles personnalisées (pas les règles par défaut)
3. Testez en créant un document dans Firestore et vérifiez les permissions

---

## Notes importantes

- ⚠️ **Les règles sont appliquées immédiatement** après publication
- 🔒 Assurez-vous que vos règles sont correctes avant de publier
- 📝 Les règles par défaut permettent à tous de lire/écrire - **changez-les immédiatement !**
- 🧪 Utilisez l'onglet "Simulateur" dans Firebase Console pour tester vos règles

---

## Règles par défaut (À NE PAS UTILISER)

Les règles par défaut de Firebase sont :
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Ou pire encore (mode test) :
```
allow read, write: if request.time < timestamp.date(2024, 12, 31);
```

**Remplacez-les immédiatement par les règles du fichier `firestore.rules` !**

