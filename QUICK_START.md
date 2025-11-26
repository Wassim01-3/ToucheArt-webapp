# Guide de démarrage rapide - ToucheArt

Ce guide vous aidera à configurer rapidement votre application.

## 📋 Checklist de configuration

### 1. ✅ Assets (Images)
- [ ] Logo ajouté dans `assets/logo.png`
- [ ] Générer les autres assets (voir `GENERATE_ASSETS.md`)

**Option rapide :**
```bash
# Installer Pillow si nécessaire
pip install Pillow

# Générer tous les assets automatiquement
python scripts/generate-assets.py
```

### 2. 🔥 Firebase Configuration

#### A. Créer un projet Firebase
1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Nommez-le "ToucheArt" (ou autre)
4. Suivez les étapes de configuration

#### B. Activer les services
1. **Firestore Database** :
   - Créez une base de données en mode "Production"
   - Choisissez une région (ex: europe-west1)

2. **Authentication** :
   - Activez "Email/Password"
   - (Google Sign-In n'est plus nécessaire)

#### C. Configurer l'application
1. Dans Firebase Console, allez dans "Paramètres du projet" (⚙️)
2. Dans "Vos applications", ajoutez une application Web
3. Copiez les valeurs de configuration
4. Mettez à jour `app/services/firebase.js` :

```javascript
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};
```

### 3. 🔒 Déployer les règles Firestore

**Méthode simple (Recommandée) :**
1. Allez dans Firebase Console → Firestore Database → Règles
2. Ouvrez `firestore.rules` dans votre projet
3. Copiez tout le contenu
4. Collez dans Firebase Console
5. Cliquez sur "Publier"

📖 **Guide détaillé :** Voir `DEPLOY_FIRESTORE_RULES.md`

### 4. 👤 Créer l'utilisateur Admin

**Méthode 1 : Via l'application (Plus simple)**
1. Lancez l'app : `npm start`
2. Inscrivez-vous avec :
   - Email: `admin@admin.com`
   - Password: `adminadmin`
3. L'app créera automatiquement le rôle admin

**Méthode 2 : Via Firebase Console**
1. Firebase Console → Authentication → Ajouter un utilisateur
2. Email: `admin@admin.com`
3. Password: `adminadmin`
4. Copiez l'UID
5. Firestore → Créer un document dans `users` :
   - Document ID: [l'UID]
   - Champs:
     ```
     email: "admin@admin.com"
     name: "Admin User"
     role: "admin"
     verifiedSeller: false
     createdAt: [date actuelle]
     ```

📖 **Guide détaillé :** Voir `scripts/create-admin-user-simple.js`

### 5. ☁️ Cloudinary Configuration

1. Créez un compte sur [Cloudinary](https://cloudinary.com/)
2. Dans le Dashboard, notez :
   - Cloud Name
   - API Key
   - API Secret
3. Créez un Upload Preset :
   - Settings → Upload → Upload presets
   - Créez un nouveau preset (ex: "toucheart_upload")
   - Mode: "Unsigned" (pour simplifier)
4. Mettez à jour `app/services/cloudinary.js` :

```javascript
const CLOUDINARY_CLOUD_NAME = 'VOTRE_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = 'VOTRE_UPLOAD_PRESET';
const CLOUDINARY_API_KEY = 'VOTRE_API_KEY';
const CLOUDINARY_API_SECRET = 'VOTRE_API_SECRET';
```

### 6. 🚀 Lancer l'application

```bash
# Installer les dépendances
npm install

# Lancer l'application
npm start
```

Puis :
- Appuyez sur `i` pour iOS (nécessite Xcode)
- Appuyez sur `a` pour Android (nécessite Android Studio)
- Scannez le QR code avec Expo Go sur votre téléphone

## ✅ Vérification finale

Testez ces fonctionnalités :

- [ ] L'application démarre sans erreur
- [ ] L'inscription fonctionne
- [ ] La connexion fonctionne
- [ ] L'admin peut se connecter avec `admin@admin.com` / `adminadmin`
- [ ] Les produits s'affichent (même si vide)
- [ ] L'upload d'images fonctionne (Cloudinary)
- [ ] Les règles Firestore sont actives (testez en créant un produit)

## 🆘 Problèmes courants

### Erreur Firebase
- Vérifiez que Firebase est correctement configuré
- Vérifiez que Firestore et Auth sont activés

### Erreur Cloudinary
- Vérifiez les credentials
- Vérifiez que l'Upload Preset est en mode "Unsigned"

### Assets manquants
- Exécutez `python scripts/generate-assets.py`
- Vérifiez que tous les fichiers sont dans `assets/`

### Admin ne fonctionne pas
- Vérifiez que le champ `role: "admin"` existe dans Firestore
- Vérifiez que l'email correspond exactement à `admin@admin.com`

## 📚 Documentation complète

- `DEPLOY_FIRESTORE_RULES.md` - Déployer les règles Firestore
- `GENERATE_ASSETS.md` - Générer les assets
- `SETUP.md` - Guide de configuration détaillé
- `README.md` - Documentation principale

## 🎉 Prêt !

Votre application ToucheArt est maintenant configurée et prête à être utilisée !

