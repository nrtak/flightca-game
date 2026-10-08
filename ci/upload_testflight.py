from pathlib import Path
import base64, os, re, subprocess, tempfile

root = Path(__file__).resolve().parents[1]
ipas = list((root / 'build/ipa').glob('*.ipa'))
if len(ipas) != 1: raise ValueError('Expected exactly one signed IPA.')
key = os.environ['ASC_KEY_ID']
issuer = os.environ['ASC_ISSUER_ID']
if not re.fullmatch(r'[A-Za-z0-9]+',key): raise ValueError('Invalid API key ID.')
with tempfile.TemporaryDirectory(prefix='cabin-upload-') as folder:
    private = Path(folder) / ('AuthKey_' + key + '.p8')
    private.write_bytes(base64.b64decode(os.environ['ASC_PRIVATE_KEY_BASE64'],validate=True))
    private.chmod(0o600)
    env = dict(os.environ, API_PRIVATE_KEYS_DIR=folder)
    subprocess.run(['xcrun','altool','--upload-app','--type','ios','--file',str(ipas[0]),'--apiKey',key,'--apiIssuer',issuer],env=env,check=True)
