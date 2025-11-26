# ToucheArt - React Native Expo Mobile Application

A complete React Native Expo SDK 54 mobile application for buying and selling art and crafts in Tunisia.

## Features

- **Multi-language Support**: French (default) and Arabic (RTL)
- **User Authentication**: Email/Password and Google OAuth
- **Product Listings**: Browse products by governorate
- **Real-time Chat**: Messenger-like chat system with push notifications
- **Favorites System**: Save and manage favorite products
- **Seller Dashboard**: Verified sellers can manage their products
- **Admin Panel**: Approve seller requests and manage complaints
- **Maps Integration**: View seller locations on map
- **Image Carousel**: Beautiful product image galleries
- **Cloudinary Integration**: Cloud-based image storage

## Tech Stack

- **Framework**: React Native + Expo SDK 54
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Storage**: Cloudinary
- **Notifications**: Expo Push Notifications
- **Maps**: react-native-maps
- **Navigation**: React Navigation
- **i18n**: react-i18next

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Configuration

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google)
3. Create a Firestore database
4. Update `app/services/firebase.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Deploy Firestore rules from `firestore.rules`

### 3. Cloudinary Configuration

1. Create a Cloudinary account at [Cloudinary](https://cloudinary.com/)
2. Get your Cloud Name, Upload Preset, API Key, and API Secret
3. Update `app/services/cloudinary.js` with your credentials:

```javascript
const CLOUDINARY_CLOUD_NAME = 'YOUR_CLOUD_NAME';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';
const CLOUDINARY_API_KEY = 'YOUR_API_KEY';
const CLOUDINARY_API_SECRET = 'YOUR_API_SECRET';
```

### 4. Google Sign-In Setup

1. Configure Google OAuth in Firebase Console
2. For iOS: Add your iOS Client ID to `app/context/AuthContext.js`
3. For Android: Add your Android Client ID to `app/context/AuthContext.js`

### 5. Assets

1. Place your logo at `assets/logo.png`
2. Create placeholder images:
   - `assets/icon.png` (1024x1024)
   - `assets/splash.png` (1242x2436)
   - `assets/adaptive-icon.png` (1024x1024)
   - `assets/favicon.png` (48x48)

### 6. Run the App

```bash
# Start Expo
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## App Structure

```
/app
  /screens          # All screen components
  /components       # Reusable UI components
  /navigation       # Navigation configuration
  /context          # React contexts (Auth, Language, Theme)
  /services         # Firebase and Cloudinary services
  /utils            # Utilities and constants
  /locales          # Translation files (fr.json, ar.json)
  /assets           # Images and static assets
```

## User Roles

1. **Visitor**: Non-logged in users can browse products
2. **User**: Logged in users can chat, favorite, and report
3. **Verified Seller**: Can add, edit, and delete products
4. **Admin**: Can approve seller requests and manage complaints
   - Email: `admin@admin.com`
   - Password: `adminadmin`

## Color Palette

- Primary (Beige): `#D4A574`
- Secondary (Bordeaux Red): `#8B0000`
- Accent (Yellow/Gold): `#FFD700`
- Light Yellow: `#FFF8DC`
- Light Beige: `#F5E6D3`

## Features Breakdown

### Home Screen
- Language selector (FR/AR)
- Governorate filter
- Guest access, Login, Register, Become Seller buttons

### Authentication
- Email/Password registration and login
- Google OAuth sign-in
- Profile photo upload

### Seller Request
- Form with identity verification
- Admin approval required
- Conditions acceptance

### Product Listings
- Filter by governorate
- Image carousel
- Favorite functionality
- Product cards with price and location

### Product Details
- Full image gallery
- Bilingual descriptions
- Seller information with verified badge
- Map showing seller location
- Chat and call buttons

### Chat System
- Real-time messaging
- Active chats list
- Online/offline status
- Push notifications

### Seller Dashboard
- Product CRUD operations
- Multiple image uploads
- Bilingual product information

### Admin Panel
- Seller request approval/rejection
- Complaint management
- User verification

## Firestore Collections

- `users`: User profiles and roles
- `products`: Product listings
- `sellerRequests`: Pending seller applications
- `chats`: Chat conversations
- `favorites`: User favorite products
- `complaints`: User reports

## Security Rules

Firestore security rules are configured in `firestore.rules`:
- Public read access for products
- Authenticated write access for verified sellers
- Admin-only access for seller requests and complaints
- User-specific access for favorites and chats

## Push Notifications

The app is configured for Expo Push Notifications. To enable:
1. Configure push notification certificates in Expo
2. Update notification handlers in `App.js`
3. Implement notification listeners in chat screens

## RTL Support

Arabic language is fully RTL compatible:
- Text alignment adjusts automatically
- Layouts flip for RTL languages
- Carousels and navigation adapt to RTL

## License

This project is private and proprietary.

## Support

For issues or questions, please contact the development team.

