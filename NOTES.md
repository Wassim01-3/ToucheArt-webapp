# Important Notes for ToucheArt

## Logo Setup

The app expects a logo at `assets/logo.png`. You mentioned a logo file at `/mnt/data/Design sans titre (6).png`. Please copy this file to `assets/logo.png` in the project root.

## Configuration Required

### 1. Firebase Setup
- Replace placeholder values in `app/services/firebase.js`
- Enable Email/Password and Google authentication
- Deploy Firestore rules from `firestore.rules`

### 2. Cloudinary Setup
- Replace placeholder values in `app/services/cloudinary.js`
- Create an upload preset in Cloudinary dashboard
- Configure CORS settings

### 3. Google Sign-In
- Configure OAuth in Firebase Console
- Add iOS and Android client IDs in `app/context/AuthContext.js`

### 4. Assets
Create these files in `assets/`:
- `logo.png` (your logo)
- `icon.png` (1024x1024)
- `splash.png` (1242x2436)
- `adaptive-icon.png` (1024x1024)
- `favicon.png` (48x48)

## Known Limitations

1. **Cloudinary Delete**: The delete function requires server-side signature generation for security. Currently returns empty signature.

2. **Google Sign-In**: Requires proper OAuth configuration in Firebase and Expo.

3. **Push Notifications**: Full implementation requires Expo push notification certificates.

4. **Location**: Product location coordinates need to be set when creating products (not automatically captured).

## Testing Checklist

- [ ] Firebase authentication works
- [ ] Google sign-in works
- [ ] Image uploads to Cloudinary
- [ ] Products can be created/edited/deleted
- [ ] Chat messages send/receive
- [ ] Favorites save/remove
- [ ] Admin can approve sellers
- [ ] Language switching works (FR/AR)
- [ ] RTL layout works for Arabic
- [ ] Maps display correctly
- [ ] Push notifications work

## Production Considerations

1. Move Cloudinary API secret to environment variables (server-side)
2. Implement proper error boundaries
3. Add analytics tracking
4. Set up crash reporting
5. Configure app store metadata
6. Test on physical devices
7. Review and optimize images
8. Set up monitoring and alerts

## Support

For issues or questions:
1. Check README.md for setup instructions
2. Review SETUP.md for detailed configuration
3. Check Firebase and Cloudinary documentation
4. Review Expo SDK 54 documentation

