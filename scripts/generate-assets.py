#!/usr/bin/env python3
"""
Script pour générer automatiquement tous les assets requis
à partir de logo.png

Usage: python scripts/generate-assets.py
"""

from PIL import Image, ImageDraw
import os
import sys

# Couleur de fond beige (RGB)
BG_COLOR = (212, 165, 116)  # #D4A574

def generate_assets():
    """Génère tous les assets requis à partir de logo.png"""
    
    # Vérifier que logo.png existe
    logo_path = 'app/assets/logo.png'
    if not os.path.exists(logo_path):
        print("❌ Erreur: assets/logo.png n'existe pas!")
        print("   Veuillez d'abord ajouter votre logo dans assets/logo.png")
        sys.exit(1)
    
    # Créer le dossier assets s'il n'existe pas
    os.makedirs('assets', exist_ok=True)
    
    try:
        # Ouvrir le logo
        logo = Image.open(logo_path)
        
        # Convertir en RGBA si nécessaire pour la transparence
        if logo.mode != 'RGBA':
            logo = logo.convert('RGBA')
        
        print("📸 Logo chargé:", logo.size)
        print("🎨 Génération des assets...\n")
        
        # 1. icon.png (1024x1024)
        print("1️⃣  Génération de icon.png (1024x1024)...")
        icon = logo.resize((1024, 1024), Image.Resampling.LANCZOS)
        icon.save('app/assets/icon.png', 'PNG')
        print("   ✅ Généré: app/assets/icon.png")
        
        # 2. adaptive-icon.png (1024x1024 avec fond beige)
        print("2️⃣  Génération de adaptive-icon.png (1024x1024 avec fond)...")
        adaptive = Image.new('RGB', (1024, 1024), BG_COLOR)
        logo_resized = logo.resize((800, 800), Image.Resampling.LANCZOS)
        x = (1024 - 800) // 2
        y = (1024 - 800) // 2
        # Coller le logo avec transparence
        if logo_resized.mode == 'RGBA':
            adaptive.paste(logo_resized, (x, y), logo_resized)
        else:
            adaptive.paste(logo_resized, (x, y))
        adaptive.save('app/assets/adaptive-icon.png', 'PNG')
        print("   ✅ Généré: assets/adaptive-icon.png")
        
        # 3. favicon.png (48x48)
        print("3️⃣  Génération de favicon.png (48x48)...")
        favicon = logo.resize((48, 48), Image.Resampling.LANCZOS)
        favicon.save('app/assets/favicon.png', 'PNG')
        print("   ✅ Généré: app/assets/favicon.png")
        
        # 4. splash.png (1242x2436 avec fond beige)
        print("4️⃣  Génération de splash.png (1242x2436 avec fond)...")
        splash = Image.new('RGB', (1242, 2436), BG_COLOR)
        logo_resized = logo.resize((800, 800), Image.Resampling.LANCZOS)
        x = (1242 - 800) // 2
        y = (2436 - 800) // 2
        # Coller le logo avec transparence
        if logo_resized.mode == 'RGBA':
            splash.paste(logo_resized, (x, y), logo_resized)
        else:
            splash.paste(logo_resized, (x, y))
        splash.save('app/assets/splash.png', 'PNG')
        print("   ✅ Généré: app/assets/splash.png")
        
        print("\n" + "="*50)
        print("🎉 Tous les assets ont été générés avec succès!")
        print("="*50)
        print("\n📁 Fichiers générés dans assets/:")
        print("   ✅ icon.png (1024x1024)")
        print("   ✅ adaptive-icon.png (1024x1024)")
        print("   ✅ favicon.png (48x48)")
        print("   ✅ splash.png (1242x2436)")
        print("\n💡 Vous pouvez maintenant lancer: npm start")
        
    except Exception as e:
        print(f"❌ Erreur lors de la génération: {e}")
        print("\n💡 Assurez-vous que:")
        print("   1. Pillow est installé: pip install Pillow")
        print("   2. logo.png existe dans assets/")
        print("   3. Vous avez les permissions d'écriture")
        sys.exit(1)

if __name__ == '__main__':
    print("╔══════════════════════════════════════════════════════╗")
    print("║   Génération des Assets - ToucheArt                  ║")
    print("╚══════════════════════════════════════════════════════╝")
    print()
    generate_assets()

