/**
 * Script simplifié pour créer l'utilisateur admin
 * Utilise directement Firebase SDK sans configuration complexe
 * 
 * Usage: node scripts/create-admin-user-simple.js
 */

// Ce script nécessite que vous ayez configuré Firebase dans votre app
// Vous pouvez aussi créer l'admin manuellement via l'app

console.log(`
╔══════════════════════════════════════════════════════════════╗
║     Création de l'utilisateur Admin - ToucheArt            ║
╚══════════════════════════════════════════════════════════════╝

📋 MÉTHODE 1 : Via l'application (Recommandé)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Lancez l'application : npm start
2. Inscrivez-vous avec :
   - Email: admin@admin.com
   - Password: adminadmin
3. L'application créera automatiquement le rôle admin
   (voir app/context/AuthContext.js ligne 34-38)

📋 MÉTHODE 2 : Via Firebase Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Allez sur Firebase Console → Authentication
2. Cliquez sur "Ajouter un utilisateur"
3. Entrez:
   - Email: admin@admin.com
   - Password: adminadmin
4. Cliquez sur "Ajouter"
5. Copiez l'UID de l'utilisateur créé
6. Allez dans Firestore Database
7. Créez un document dans la collection "users" avec:
   - Document ID: [l'UID copié]
   - Champs:
     * email: "admin@admin.com"
     * name: "Admin User"
     * role: "admin"
     * verifiedSeller: false
     * createdAt: [date actuelle]

📋 MÉTHODE 3 : Via le script Node.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Configurez Firebase dans app/services/firebase.js
2. Installez les dépendances: npm install
3. Exécutez: node scripts/create-admin-user.js

⚠️  IMPORTANT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Changez le mot de passe après la première connexion
- Ne partagez jamais les identifiants admin
- Utilisez des mots de passe forts en production

📧 Identifiants Admin:
   Email: admin@admin.com
   Password: adminadmin

`);

