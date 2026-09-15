#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'assets' / 'daten'
OUT = ROOT / '.gitignore'
MEDIA_EXT = {'.png','.jpg','.jpeg','.webp','.gif','.bmp','.tif','.tiff','.avif','.mp3','.wav','.ogg','.flac','.m4a','.aac','.wma','.opus','.mkv','.mp4','.mov','.avi','.webm','.m4v','.ts','.m2ts'}

STANDARD = '''# ============================================================
# AUTOMATISCH ERZEUGT
# Quelle: Standardregeln + githubFreigabe aus assets/daten/**/*.json
# NICHT von Hand bearbeiten – tools/gitignore-aus-json.py erzeugt diese Datei.
# ============================================================

# Archive
*.zip
*.rar
*.7z
*.tar
*.tar.gz

# Automatisch erzeugte Share-Dateien
/share/

# System
.DS_Store
Thumbs.db

# Python
__pycache__/
*.pyc

# Lokale/private Medien und Cache
/assets/cache/
/assets/private/
/assets/medien/lokal/

# Medien in Tier-/Kino-Daten standardmässig NICHT veröffentlichen.
/assets/daten/**/*.png
/assets/daten/**/*.jpg
/assets/daten/**/*.jpeg
/assets/daten/**/*.webp
/assets/daten/**/*.gif
/assets/daten/**/*.bmp
/assets/daten/**/*.tif
/assets/daten/**/*.tiff
/assets/daten/**/*.avif
/assets/daten/**/*.mp3
/assets/daten/**/*.wav
/assets/daten/**/*.ogg
/assets/daten/**/*.flac
/assets/daten/**/*.m4a
/assets/daten/**/*.aac
/assets/daten/**/*.wma
/assets/daten/**/*.opus
/assets/daten/**/*.mkv
/assets/daten/**/*.mp4
/assets/daten/**/*.mov
/assets/daten/**/*.avi
/assets/daten/**/*.webm
/assets/daten/**/*.m4v
/assets/daten/**/*.ts
/assets/daten/**/*.m2ts
'''

def walk(value):
    if isinstance(value, dict):
        if isinstance(value.get('pfad'), str) and Path(value['pfad']).suffix.lower() in MEDIA_EXT:
            yield value
        for v in value.values():
            yield from walk(v)
    elif isinstance(value, list):
        for v in value:
            yield from walk(v)

def gitignore_escape(path: str) -> str:
    # Gitignore: führendes / = relativ zum Repository. Leerzeichen müssen nicht escaped werden.
    return '/' + path.lstrip('/').replace('\\', '/')

allowed = set()
errors = []
for jf in DATA.rglob('*.json'):
    try:
        data = json.loads(jf.read_text(encoding='utf-8'))
    except Exception as e:
        errors.append(f'{jf.relative_to(ROOT)}: {e}')
        continue
    for item in walk(data):
        if item.get('githubFreigabe') is True:
            allowed.add(item['pfad'])

if errors:
    print('❌ Ungültige JSON-Datei(en):')
    for e in errors: print(' -', e)
    raise SystemExit(1)

text = STANDARD
if allowed:
    text += '\n# ------------------------------------------------------------\n# Durch JSON ausdrücklich für GitHub freigegebene Medien\n# githubFreigabe: true\n# ------------------------------------------------------------\n'
    for p in sorted(allowed, key=str.casefold):
        text += '!' + gitignore_escape(p) + '\n'
else:
    text += '\n# Keine Medien sind derzeit mit githubFreigabe: true freigegeben.\n'

OUT.write_text(text, encoding='utf-8')
print(f'✅ .gitignore erzeugt: {len(allowed)} freigegebene Mediendatei(en).')
