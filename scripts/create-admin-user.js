/**
 * Script pour créer l'utilisateur admin dans Firebase
 * 
 * Usage:
 * 1. Configurez Firebase dans app/services/firebase.js
 * 2. Exécutez: node scripts/create-admin-user.js
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Importez votre configuration Firebase
// NOTE: Remplacez ces valeurs par vos vraies valeurs Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'adminadmin';
const ADMIN_NAME = 'Admin User';

async function createAdminUser() {
  try {
    console.log('🚀 Initialisation de Firebase...');
    
    // Initialiser Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('📧 Création du compte admin...');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);

    // Créer l'utilisateur dans Firebase Auth
    let userCredential;
    try {
      userCredential = await createUserWithEmailAndPassword(
        auth,
        ADMIN_EMAIL,
        ADMIN_PASSWORD
      );
      console.log('✅ Utilisateur créé dans Firebase Auth');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('⚠️  L\'utilisateur existe déjà dans Firebase Auth');
        // Récupérer l'utilisateur existant
        const { signInWithEmailAndPassword } = require('firebase/auth');
        userCredential = await signInWithEmailAndPassword(
          auth,
          ADMIN_EMAIL,
          ADMIN_PASSWORD
        );
      } else {
        throw error;
      }
    }

    const user = userCredential.user;
    console.log(`   User ID: ${user.uid}`);

    // Créer le document utilisateur dans Firestore avec le rôle admin
    const userRef = doc(db, 'users', user.uid);
    
    await setDoc(userRef, {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      phone: '',
      address: '',
      governorate: '',
      profilePhoto: '',
      role: 'admin',
      verifiedSeller: false,
      createdAt: new Date().toISOString(),
      isAdmin: true,
    }, { merge: true });

    console.log('✅ Document utilisateur créé dans Firestore avec le rôle admin');
    console.log('\n🎉 Utilisateur admin créé avec succès !');
    console.log('\n📋 Informations de connexion:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`   User ID: ${user.uid}`);
    console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !');

  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur admin:', error);
    console.error('\n💡 Vérifiez que:');
    console.error('   1. Firebase est correctement configuré');
    console.error('   2. Les valeurs dans firebaseConfig sont correctes');
    console.error('   3. Firebase Auth est activé dans Firebase Console');
    console.error('   4. Firestore est activé dans Firebase Console');
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };

