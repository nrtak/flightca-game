"""Stage the offline game and a temporary starter app icon."""
from pathlib import Path
import json, shutil, struct, zlib

ROOT = Path(__file__).resolve().parents[1]
web = ROOT / 'ios' / 'Web'
web.mkdir(parents=True, exist_ok=True)
for source in (ROOT / 'game').iterdir():
    if source.suffix in ('.html', '.js', '.css'):
        shutil.copy2(source, web / source.name)
(web / 'assets').mkdir(exist_ok=True)
for source in (ROOT / 'game' / 'assets').glob('*.png'):
    shutil.copy2(source, web / 'assets' / source.name)

icons = ROOT / 'ios' / 'Assets.xcassets' / 'AppIcon.appiconset'
icons.mkdir(parents=True, exist_ok=True)
def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', zlib.crc32(kind + data) & 0xffffffff)
# Opaque geometric aircraft icon; replace with final artwork before release.
pixels = bytearray()
for y in range(1024):
    pixels.append(0)
    for x in range(1024):
        body = abs(x-512) < 42 and 190 < y < 830
        wings = 400 < y < 600 and abs(x-512) < (y-380)*1.5
        tail = 730 < y < 810 and abs(x-512) < 145
        pixels.extend((222, 249, 239) if body or wings or tail else (35, 64, 90))
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B',1024,1024,8,2,0,0,0)) + chunk(b'IDAT',zlib.compress(pixels)) + chunk(b'IEND',b'')
(icons / 'AppIcon.png').write_bytes(png)
selected_icon = ROOT / 'branding' / 'AppIcon.png'
if selected_icon.exists():
    shutil.copy2(selected_icon, icons / 'AppIcon.png')
(icons / 'Contents.json').write_text(json.dumps({'images':[{'filename':'AppIcon.png','idiom':'universal','platform':'ios','size':'1024x1024'}],'info':{'author':'xcode','version':1}}))
(icons.parent / 'Contents.json').write_text(json.dumps({'info':{'author':'xcode','version':1}}))
print('Offline game and app icon staged.')
