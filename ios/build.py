#!/usr/bin/env python3
import pathlib, subprocess, plistlib, shutil, zipfile, sys, hashlib, os
root=pathlib.Path(__file__).resolve().parent.parent
mode=sys.argv[1] if len(sys.argv)>1 else 'device'
sdk='iphonesimulator' if mode=='simulator' else 'iphoneos'
target='arm64-apple-ios16.0'+('-simulator' if mode=='simulator' else '')
build=root/'build'/mode; app=build/'Payload/LemonadeTycoon.app'; app.mkdir(parents=True,exist_ok=True)
sdkpath=subprocess.check_output(['xcrun','--sdk',sdk,'--show-sdk-path'],text=True).strip()
subprocess.run(['xcrun','clang','-target',target,'-isysroot',sdkpath,'-fobjc-arc','-O2',str(root/'ios/Main.m'),'-framework','UIKit','-framework','WebKit','-framework','Foundation','-framework','CoreGraphics','-o',str(app/'LemonadeTycoon')],check=True)
if (app/'Web').exists(): shutil.rmtree(app/'Web')
shutil.copytree(root/'game/dist',app/'Web')
shutil.copy2(root/'game/LICENSE',app/'LICENSE.txt')
if mode=='simulator': shutil.copy2(root/'ios/smoke.js',app/'smoke.js')
info=dict(CFBundleExecutable='LemonadeTycoon',CFBundleIdentifier='com.wireproof.lemonadetycoon',CFBundleName='Lemonade Tycoon',CFBundleDisplayName='Lemonade Tycoon',CFBundleVersion='4',CFBundleShortVersionString='0.2.1',CFBundlePackageType='APPL',MinimumOSVersion='16.0',LSRequiresIPhoneOS=True,UIDeviceFamily=[1,2],UILaunchScreen={},UIRequiresFullScreen=False,UISupportedInterfaceOrientations=['UIInterfaceOrientationPortrait','UIInterfaceOrientationLandscapeLeft','UIInterfaceOrientationLandscapeRight'],UIFileSharingEnabled=True,LSSupportsOpeningDocumentsInPlace=True,ITSAppUsesNonExemptEncryption=False,UIApplicationSceneManifest={'UIApplicationSupportsMultipleScenes':False,'UISceneConfigurations':{'UIWindowSceneSessionRoleApplication':[{'UISceneConfigurationName':'Lemonade','UISceneDelegateClassName':'LemonadeScene'}]}})
icons=root/'ios/icons'
if icons.exists():
 for p in icons.glob('*.png'): shutil.copy2(p,app/p.name)
 info['CFBundleIcons']={'CFBundlePrimaryIcon':{'CFBundleIconFiles':['AppIcon120','AppIcon180']}}
 info['CFBundleIcons~ipad']={'CFBundlePrimaryIcon':{'CFBundleIconFiles':['AppIcon152','AppIcon167']}}
(app/'Info.plist').write_bytes(plistlib.dumps(info))
identity=os.environ.get('LEMONADE_SIGN_IDENTITY','-')
profile=os.environ.get('LEMONADE_PROFILE')
args=['codesign','--force','--sign',identity,'--timestamp=none']
if profile and mode=='device':
 d=plistlib.loads(subprocess.check_output(['security','cms','-D','-i',profile]))
 team=d['TeamIdentifier'][0]
 ent={'application-identifier':team+'.com.wireproof.lemonadetycoon','com.apple.developer.team-identifier':team,'get-task-allow':True,'keychain-access-groups':[team+'.com.wireproof.lemonadetycoon']}
 ep=build/'entitlements.plist'; ep.write_bytes(plistlib.dumps(ent))
 shutil.copy2(profile,app/'embedded.mobileprovision');args+=['--entitlements',str(ep)]
subprocess.run(args+[str(app)],check=True)
if mode=='device':
 out=root/'LemonadeTycoon-Remastered-v0.2.1.ipa'
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
  for p in app.rglob('*'):
   if p.is_file(): z.write(p,p.relative_to(build))
 (root/'SHA256SUMS').write_text(hashlib.sha256(out.read_bytes()).hexdigest()+'  '+out.name+'\n')
 print(out)
print(app)
