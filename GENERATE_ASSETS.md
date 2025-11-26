# Guide pour générer les assets requis

Vous avez déjà ajouté `logo.png`. Maintenant, générons les autres fichiers assets requis.

## Fichiers requis

D'après `app.json`, vous avez besoin de :
- ✅ `assets/logo.png` (déjà ajouté)
- ❌ `assets/icon.png` (1024x1024)
- ❌ `assets/splash.png` (1242x2436)
- ❌ `assets/adaptive-icon.png` (1024x1024)
- ❌ `assets/favicon.png` (48x48)

## Méthode 1 : Utiliser un outil en ligne (Recommandé)

### Option A : AppIcon.co (Gratuit)
1. Allez sur [AppIcon.co](https://www.appicon.co/)
2. Téléchargez votre `logo.png`
3. Sélectionnez "Expo" comme plateforme
4. Téléchargez tous les assets générés
5. Placez-les dans le dossier `assets/`

### Option B : IconKitchen (Gratuit)
1. Allez sur [IconKitchen](https://icon.kitchen/)
2. Téléchargez votre `logo.png`
3. Sélectionnez les tailles nécessaires
4. Téléchargez et placez dans `assets/`

## Méthode 2 : Utiliser ImageMagick (Ligne de commande)

Si vous avez ImageMagick installé :

```bash
# Créer le dossier assets s'il n'existe pas
mkdir -p assets

# Générer icon.png (1024x1024)
magick convert assets/logo.png -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/icon.png

# Générer adaptive-icon.png (1024x1024)
magick convert assets/logo.png -resize 1024x1024 -background "#D4A574" -gravity center -extent 1024x1024 assets/adaptive-icon.png

# Générer favicon.png (48x48)
magick convert assets/logo.png -resize 48x48 assets/favicon.png

# Générer splash.png (1242x2436) - avec fond beige
magick convert assets/logo.png -resize 800x800 -background "#D4A574" -gravity center -extent 1242x2436 assets/splash.png
```

## Méthode 3 : Utiliser Python + PIL (Script automatique)

Créez un fichier `scripts/generate-assets.py` :

```python
from PIL import Image, ImageDraw
import os

# Couleur de fond (beige)
BG_COLOR = "#D4A574"

def generate_assets():
    # Vérifier que logo.png existe
    if not os.path.exists('assets/logo.png'):
        print("❌ Erreur: assets/logo.png n'existe pas!")
        return
    
    logo = Image.open('assets/logo.png')
    
    # 1. icon.png (1024x1024)
    icon = logo.resize((1024, 1024), Image.Resampling.LANCZOS)
    icon.save('assets/icon.png')
    print("✅ Généré: assets/icon.png")
    
    # 2. adaptive-icon.png (1024x1024 avec fond)
    adaptive = Image.new('RGB', (1024, 1024), BG_COLOR)
    logo_resized = logo.resize((800, 800), Image.Resampling.LANCZOS)
    x = (1024 - 800) // 2
    y = (1024 - 800) // 2
    adaptive.paste(logo_resized, (x, y), logo_resized if logo.mode == 'RGBA' else None)
    adaptive.save('assets/adaptive-icon.png')
    print("✅ Généré: assets/adaptive-icon.png")
    
    # 3. favicon.png (48x48)
    favicon = logo.resize((48, 48), Image.Resampling.LANCZOS)
    favicon.save('assets/favicon.png')
    print("✅ Généré: assets/favicon.png")
    
    # 4. splash.png (1242x2436 avec fond)
    splash = Image.new('RGB', (1242, 2436), BG_COLOR)
    logo_resized = logo.resize((800, 800), Image.Resampling.LANCZOS)
    x = (1242 - 800) // 2
    y = (2436 - 800) // 2
    splash.paste(logo_resized, (x, y), logo_resized if logo.mode == 'RGBA' else None)
    splash.save('assets/splash.png')
    print("✅ Généré: assets/splash.png")
    
    print("\n🎉 Tous les assets ont été générés avec succès!")

if __name__ == '__main__':
    generate_assets()
```

Exécutez :
```bash
pip install Pillow
python scripts/generate-assets.py
```

## Méthode 4 : Utiliser un éditeur d'images (Manuel)

### Pour icon.png et adaptive-icon.png :
1. Ouvrez votre `logo.png` dans un éditeur (Photoshop, GIMP, etc.)
2. Redimensionnez à 1024x1024 pixels
3. Pour `adaptive-icon.png`, ajoutez un fond beige (#D4A574)
4. Enregistrez dans `assets/`

### Pour splash.png :
1. Créez une nouvelle image 1242x2436 pixels
2. Remplissez avec la couleur beige (#D4A574)
3. Placez votre logo au centre (taille ~800x800)
4. Enregistrez dans `assets/`

### Pour favicon.png :
1. Redimensionnez votre logo à 48x48 pixels
2. Enregistrez dans `assets/`

## Vérification

Après avoir généré tous les fichiers, votre dossier `assets/` devrait contenir :

```
assets/
├── logo.png          ✅ (déjà ajouté)
├── icon.png          ✅ (1024x1024)
├── splash.png        ✅ (1242x2436)
├── adaptive-icon.png ✅ (1024x1024)
└── favicon.png       ✅ (48x48)
```

## Notes importantes

- ⚠️ **icon.png** : Doit être carré (1024x1024), sans coins arrondis (Expo les ajoutera automatiquement)
- 🎨 **adaptive-icon.png** : Peut avoir un fond coloré (beige #D4A574)
- 📱 **splash.png** : Écran de démarrage, utilisez un fond beige avec le logo centré
- 🌐 **favicon.png** : Pour la version web, petit format (48x48)
- 📐 Toutes les images doivent être en PNG avec transparence si nécessaire

## Test

Après avoir généré les assets, testez avec :
```bash
npm start
```

Expo devrait détecter automatiquement les nouveaux assets.

