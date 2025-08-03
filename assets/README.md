# Assets Directory

This directory contains static assets for the RuneKey app.

## Required Assets

### App Icons
- `icon.png` - Main app icon (1024x1024px)
- `adaptive-icon.png` - Android adaptive icon (1024x1024px)
- `favicon.png` - Web favicon (64x64px)

### Splash Screen
- `splash.png` - App splash screen (1242x2436px for iPhone X)

### Default Images
- `default-token.png` - Default token icon when no logoURI is available

## Creating Assets

### App Icon (`icon.png`)
- Size: 1024x1024 pixels
- Format: PNG with transparent background
- Design: Simple, recognizable logo that works at small sizes
- Suggested: Key or lock symbol with modern gradient

### Adaptive Icon (`adaptive-icon.png`)
- Size: 1024x1024 pixels
- Format: PNG
- Safe area: Keep important elements within center 672x672 pixels
- Background will be masked on Android

### Splash Screen (`splash.png`)
- Size: 1242x2436 pixels (iPhone X dimensions)
- Format: PNG
- Background: Dark theme (#1a1a1a) to match app
- Content: Centered logo with app name

### Favicon (`favicon.png`)
- Size: 64x64 pixels
- Format: PNG
- Simple version of main icon

### Default Token (`default-token.png`)
- Size: 64x64 pixels
- Format: PNG with transparent background
- Generic token/coin symbol

## Placeholder Assets

For development, you can use simple colored squares:

```bash
# Create placeholder icon (macOS/Linux)
convert -size 1024x1024 xc:"#3B82F6" icon.png
convert -size 1024x1024 xc:"#3B82F6" adaptive-icon.png
convert -size 1242x2436 xc:"#1a1a1a" splash.png
convert -size 64x64 xc:"#3B82F6" favicon.png
convert -size 64x64 xc:"#6B7280" default-token.png
```

## Design Guidelines

### Colors
- Primary: #3B82F6 (Blue)
- Secondary: #6B7280 (Gray)
- Background: #1a1a1a (Dark)
- Accent: #10B981 (Green)

### Typography
- Keep text minimal on icons
- Use clear, readable fonts
- Ensure contrast for accessibility

### Style
- Modern, clean design
- Consistent with crypto/finance apps
- Professional appearance
- Scalable vector elements when possible