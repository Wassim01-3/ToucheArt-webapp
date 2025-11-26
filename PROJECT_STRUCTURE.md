# ToucheArt Project Structure

```
ToucheArt/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── firebase.json                   # Firebase configuration
├── firestore.rules                 # Firestore security rules
├── firestore.indexes.json          # Firestore indexes
├── .gitignore                      # Git ignore rules
├── README.md                       # Main documentation
├── SETUP.md                        # Setup instructions
├── NOTES.md                        # Important notes
│
├── app/
│   ├── screens/                    # All screen components
│   │   ├── LandingScreen.js        # Landing/home page
│   │   ├── LoginScreen.js          # Login screen
│   │   ├── RegisterScreen.js       # Registration screen
│   │   ├── SellerRequestScreen.js  # Seller application form
│   │   ├── MainHomeScreen.js       # Main product listings
│   │   ├── ProductDetailsScreen.js # Product detail view
│   │   ├── ChatScreen.js           # Chat/messaging
│   │   ├── FavoritesScreen.js      # User favorites
│   │   ├── SellerDashboardScreen.js # Seller product management
│   │   └── AdminPanelScreen.js      # Admin panel
│   │
│   ├── components/                 # Reusable UI components
│   │   ├── Button.js                # Custom button component
│   │   ├── Input.js                 # Custom input component
│   │   ├── ProductCard.js           # Product card display
│   │   ├── VerifiedBadge.js         # Verified seller badge
│   │   ├── LanguageSelector.js      # Language switcher
│   │   ├── LoadingSpinner.js        # Loading indicator
│   │   └── index.js                 # Component exports
│   │
│   ├── navigation/                  # Navigation configuration
│   │   └── AppNavigator.js          # Main navigation setup
│   │
│   ├── context/                    # React contexts
│   │   ├── AuthContext.js           # Authentication context
│   │   ├── LanguageContext.js      # Language/i18n context
│   │   └── ThemeContext.js         # Theme/colors context
│   │
│   ├── services/                   # External services
│   │   ├── firebase.js              # Firebase configuration
│   │   └── cloudinary.js            # Cloudinary image service
│   │
│   ├── utils/                      # Utilities
│   │   ├── i18n.js                  # i18next configuration
│   │   └── constants.js             # App constants (colors, governorates)
│   │
│   ├── locales/                    # Translation files
│   │   ├── fr.json                  # French translations
│   │   └── ar.json                  # Arabic translations
│   │
│   └── assets/                     # Static assets
│       └── conditions.md             # Seller conditions document
│
└── assets/                         # Root assets folder
    ├── logo.png                    # App logo (to be added)
    ├── icon.png                    # App icon (to be added)
    ├── splash.png                  # Splash screen (to be added)
    ├── adaptive-icon.png           # Android adaptive icon (to be added)
    └── favicon.png                 # Web favicon (to be added)
```

## Key Files Explained

### App.js
Main entry point that sets up providers and navigation.

### app/navigation/AppNavigator.js
Defines all routes and navigation structure. Handles authenticated vs guest flows.

### app/context/
- **AuthContext**: Manages user authentication, roles, and user data
- **LanguageContext**: Handles language switching and RTL support
- **ThemeContext**: Provides theme colors and styling constants

### app/services/
- **firebase.js**: Firebase initialization and exports
- **cloudinary.js**: Image upload/delete functions

### app/screens/
All screen components organized by feature:
- Authentication: Login, Register
- Public: Landing, MainHome, ProductDetails
- User: Favorites, Chat
- Seller: SellerRequest, SellerDashboard
- Admin: AdminPanel

### app/components/
Reusable UI components following design system.

### app/locales/
JSON files with all translated strings for French and Arabic.

## Data Flow

1. **Authentication**: AuthContext → Firebase Auth → Firestore users collection
2. **Products**: Firestore products collection → MainHomeScreen → ProductCard
3. **Chat**: Firestore chats/messages → ChatScreen (real-time)
4. **Images**: ImagePicker → Cloudinary → Firestore URLs
5. **Favorites**: Firestore favorites collection → FavoritesScreen

## State Management

- **Global State**: React Context (Auth, Language, Theme)
- **Local State**: React hooks (useState, useEffect)
- **Server State**: Firestore real-time listeners
- **Navigation State**: React Navigation

## Styling

- Colors defined in `app/utils/constants.js`
- Theme provided via ThemeContext
- RTL support via LanguageContext
- Component-level StyleSheet.create()

## Security

- Firestore rules in `firestore.rules`
- Role-based access control (visitor, user, seller, admin)
- Authentication required for protected actions
- Admin-only endpoints for sensitive operations

