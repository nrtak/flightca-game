"""Build on a macOS runner; signing material exists only for this process."""
from pathlib import Path
import base64, datetime, json, os, plistlib, re, shutil, subprocess, tempfile, zipfile

ROOT = Path(__file__).resolve().parents[1]
def run(*args, capture=False):
    return subprocess.run(args, cwd=ROOT, check=True, stdout=subprocess.PIPE if capture else None).stdout
def required(key):
    value = os.environ.get(key, '')
    if not value: raise ValueError('Missing setting: ' + key)
    return value
def main():
    signed = os.environ.get('SIGNED') == 'true'
    if os.environ.get('UPLOAD') == 'true' and not signed:
        raise ValueError('TestFlight upload requires a signed build.')
    version = os.environ.get('APP_VERSION', '0.1.0')
    number = os.environ.get('BUILD_NUMBER', '1')
    if not re.fullmatch(r'\d+\.\d+\.\d+', version) or not re.fullmatch(r'[1-9]\d*', number):
        raise ValueError('Use a three-part version and a positive integer build number.')
    bundle = required('IOS_BUNDLE_ID') if signed else os.environ.get('IOS_BUNDLE_ID') or 'com.example.cabincrew'
    if not re.fullmatch(r'[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+){2,}', bundle) or (signed and bundle.startswith('com.example.')):
        raise ValueError('Choose a real reverse-domain bundle ID for signed builds.')
    run('xcodegen','generate','--spec','ios/project.json')
    output = ROOT / 'build'
    output.mkdir(exist_ok=True)
    common = ['xcodebuild','-project','ios/CabinCrew.xcodeproj','-scheme','CabinCrew','-configuration','Release', f'PRODUCT_BUNDLE_IDENTIFIER={bundle}',f'MARKETING_VERSION={version}',f'CURRENT_PROJECT_VERSION={number}']
    if not signed:
        run(*common,'-sdk','iphonesimulator','-destination','generic/platform=iOS Simulator','-derivedDataPath','build/simulator','CODE_SIGNING_ALLOWED=NO','build')
        shutil.make_archive(str(output / 'CabinCrew-simulator'),'zip',output / 'simulator/Build/Products/Release-iphonesimulator')
        return
    team = required('APPLE_TEAM_ID')
    password = required('KEYCHAIN_PASSWORD')
    cert_password = required('IOS_CERTIFICATE_PASSWORD')
    old_keychains = run('security','list-keychains','-d','user',capture=True).decode()
    previous = re.findall(r'"([^"]+)"',old_keychains)
    installed = None
    with tempfile.TemporaryDirectory(prefix='cabin-signing-') as folder:
        temp = Path(folder)
        keychain = temp / 'build.keychain-db'
        cert = temp / 'certificate.p12'
        profile = temp / 'profile.mobileprovision'
        cert.write_bytes(base64.b64decode(required('IOS_CERTIFICATE_BASE64'),validate=True))
        profile.write_bytes(base64.b64decode(required('IOS_PROFILE_BASE64'),validate=True))
        details = plistlib.loads(run('security','cms','-D','-i',str(profile),capture=True))
        entitlement = details['Entitlements']
        if team not in details['TeamIdentifier'] or entitlement['application-identifier'].split('.',1)[1] != bundle:
            raise ValueError('Provisioning profile does not match the selected team and app.')
        if entitlement.get('get-task-allow') or details.get('ProvisionedDevices') or details.get('ProvisionsAllDevices'):
            raise ValueError('Use an App Store distribution provisioning profile.')
        if details['ExpirationDate'] <= datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None):
            raise ValueError('Provisioning profile has expired.')
        uuid = details['UUID']
        if not re.fullmatch(r'[A-Fa-f0-9-]+',uuid): raise ValueError('Invalid profile UUID.')
        destination = Path.home() / 'Library/MobileDevice/Provisioning Profiles'
        destination.mkdir(parents=True,exist_ok=True)
        installed = destination / (uuid + '.mobileprovision')
        original = installed.read_bytes() if installed.exists() else None
        try:
            shutil.copy2(profile,installed)
            run('security','create-keychain','-p',password,str(keychain))
            run('security','set-keychain-settings','-lut','21600',str(keychain))
            run('security','unlock-keychain','-p',password,str(keychain))
            run('security','import',str(cert),'-k',str(keychain),'-P',cert_password,'-T','/usr/bin/codesign','-T','/usr/bin/security')
            run('security','set-key-partition-list','-S','apple-tool:,apple:,codesign:','-s','-k',password,str(keychain))
            run('security','list-keychains','-d','user','-s',str(keychain),*previous)
            run(*common,'-sdk','iphoneos','-destination','generic/platform=iOS','-archivePath','build/CabinCrew.xcarchive',f'DEVELOPMENT_TEAM={team}',f'PROVISIONING_PROFILE_SPECIFIER={uuid}','CODE_SIGN_IDENTITY=Apple Distribution','archive')
            options = {'method':'app-store-connect','signingStyle':'manual','teamID':team,'provisioningProfiles':{bundle:uuid},'manageAppVersionAndBuildNumber':False}
            export = temp / 'ExportOptions.plist'
            export.write_bytes(plistlib.dumps(options))
            run('xcodebuild','-exportArchive','-archivePath','build/CabinCrew.xcarchive','-exportPath','build/ipa','-exportOptionsPlist',str(export))
            ipas = list((output / 'ipa').glob('*.ipa'))
            if len(ipas) != 1: raise ValueError('Expected one exported iPhone app.')
            with zipfile.ZipFile(ipas[0]) as package:
                plist_paths = [name for name in package.namelist() if re.fullmatch(r'Payload/[^/]+\.app/Info\.plist', name)]
                if len(plist_paths) != 1: raise ValueError('Expected one main app property list.')
                app = plistlib.loads(package.read(plist_paths[0]))
                if app.get('UIDeviceFamily') != [1]: raise ValueError('Exported game must target iPhone only.')
                if app.get('CFBundleIdentifier') != bundle: raise ValueError('Exported app ID mismatch.')
        finally:
            subprocess.run(['security','list-keychains','-d','user','-s',*previous],check=False)
            subprocess.run(['security','delete-keychain',str(keychain)],check=False)
            if original is None: installed.unlink(missing_ok=True)
            else: installed.write_bytes(original)
if __name__ == '__main__': main()
