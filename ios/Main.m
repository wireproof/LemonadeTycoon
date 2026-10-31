#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>
#import <TargetConditionals.h>

@interface BundleHandler : NSObject <WKURLSchemeHandler>
@end
@implementation BundleHandler
- (void)webView:(WKWebView *)webView startURLSchemeTask:(id<WKURLSchemeTask>)task {
 NSURL *root=[[[[NSBundle mainBundle] URLForResource:@"Web" withExtension:nil] URLByResolvingSymlinksInPath] URLByStandardizingPath];
 NSString *path=task.request.URL.path.stringByRemovingPercentEncoding;
 NSURL *file=[[[root URLByAppendingPathComponent:path] URLByResolvingSymlinksInPath] URLByStandardizingPath];
 if(![file.path hasPrefix:[root.path stringByAppendingString:@"/"]]) { [task didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorNoPermissionsToReadFile userInfo:nil]]; return; }
 NSData *data=[NSData dataWithContentsOfURL:file];
 if(!data) { [task didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorFileDoesNotExist userInfo:nil]]; return; }
 NSDictionary *types=@{@"html":@"text/html",@"js":@"application/javascript",@"css":@"text/css",@"png":@"image/png",@"svg":@"image/svg+xml",@"json":@"application/json",@"ttf":@"font/ttf",@"woff2":@"font/woff2",@"jpg":@"image/jpeg",@"webp":@"image/webp"};
 NSURLResponse *response=[[NSURLResponse alloc] initWithURL:task.request.URL MIMEType:types[file.pathExtension]?:@"application/octet-stream" expectedContentLength:data.length textEncodingName:@"utf-8"];
 [task didReceiveResponse:response];[task didReceiveData:data];[task didFinish];
}
- (void)webView:(WKWebView *)webView stopURLSchemeTask:(id<WKURLSchemeTask>)task {}
@end
@interface LemonadeController : UIViewController <WKNavigationDelegate, WKScriptMessageHandler>
@property(nonatomic,strong) WKWebView *web;
@property(nonatomic,strong) UILabel *status;
@end
@implementation LemonadeController
- (void)loadView {
 self.view = [UIView new]; self.view.backgroundColor = [UIColor colorWithRed:0.086 green:0.30 blue:0.15 alpha:1];
 WKWebViewConfiguration *config = [WKWebViewConfiguration new];
 #if TARGET_OS_SIMULATOR
 if([NSProcessInfo.processInfo.arguments containsObject:@"--smoke-test"]) [config.userContentController addScriptMessageHandler:self name:@"smoke"];
#endif
 config.allowsInlineMediaPlayback = YES;
 [config setURLSchemeHandler:[BundleHandler new] forURLScheme:@"lemonade"];
 [config.userContentController addScriptMessageHandler:self name:@"exportSave"];
 NSString *bridge = @"document.addEventListener('click',async(e)=>{const a=e.target.closest('a[download]'); if(a && a.href.startsWith('blob:')){e.preventDefault();try{let text=await (await fetch(a.href)).text();window.webkit.messageHandlers.exportSave.postMessage({name:a.download,text});}catch{alert('Export failed. Please try again.');}} ,true);";
 [config.userContentController addUserScript:[[WKUserScript alloc] initWithSource:bridge injectionTime:WKUserScriptInjectionTimeAtDocumentStart forMainFrameOnly:YES]];
 self.web = [[WKWebView alloc] initWithFrame:CGRectZero configuration:config];
 self.status=[UILabel new]; self.status.text=@"Loading Lemonade Tycoon…"; self.status.textColor=UIColor.whiteColor; self.status.numberOfLines=0; self.status.textAlignment=NSTextAlignmentCenter;
 self.status.translatesAutoresizingMaskIntoConstraints=NO; [self.view addSubview:self.status];
 [NSLayoutConstraint activateConstraints:@[[self.status.centerXAnchor constraintEqualToAnchor:self.view.centerXAnchor],[self.status.centerYAnchor constraintEqualToAnchor:self.view.centerYAnchor],[self.status.widthAnchor constraintEqualToAnchor:self.view.widthAnchor multiplier:0.8]]];
 self.web.navigationDelegate = self; self.web.opaque = NO; self.web.backgroundColor = self.view.backgroundColor;
 self.web.scrollView.contentInsetAdjustmentBehavior = UIScrollViewContentInsetAdjustmentNever;
 self.web.translatesAutoresizingMaskIntoConstraints = NO;
 [self.view addSubview:self.web]; UILayoutGuide *safe = self.view.safeAreaLayoutGuide;
 [NSLayoutConstraint activateConstraints:@[[self.web.topAnchor constraintEqualToAnchor:safe.topAnchor],[self.web.bottomAnchor constraintEqualToAnchor:safe.bottomAnchor],[self.web.leadingAnchor constraintEqualToAnchor:safe.leadingAnchor],[self.web.trailingAnchor constraintEqualToAnchor:safe.trailingAnchor]]];
 [self.web loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"lemonade://game/index.html"]]];
}
- (void)writeDiagnostic:(NSDictionary *)diagnostic {
 NSURL *dir=[NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
 [[NSJSONSerialization dataWithJSONObject:diagnostic options:NSJSONWritingPrettyPrinted error:nil] writeToURL:[dir URLByAppendingPathComponent:@"runtime-status.json"] atomically:YES];
}
- (void)webView:(WKWebView *)webView didFailProvisionalNavigation:(WKNavigation *)navigation withError:(NSError *)error { self.status.text=error.localizedDescription; [self.view bringSubviewToFront:self.status]; [self writeDiagnostic:@{@"error":error.description}]; }
- (void)webView:(WKWebView *)webView didFailNavigation:(WKNavigation *)navigation withError:(NSError *)error { [self webView:webView didFailProvisionalNavigation:navigation withError:error]; }
- (void)webView:(WKWebView *)webView didFinishNavigation:(WKNavigation *)navigation {
 self.status.hidden=YES;
 dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
 [webView evaluateJavaScript:@"JSON.stringify({title:document.title,menu:!!document.querySelector('#menu-continue'),canvas:!!document.querySelector('canvas'),width:innerWidth,height:innerHeight,profile:document.documentElement.dataset.display})" completionHandler:^(id result,NSError *error){ [self writeDiagnostic:@{@"page":result?:@"",@"error":error.description?:@""}]; }];
 });
#if TARGET_OS_SIMULATOR
 if([NSProcessInfo.processInfo.arguments containsObject:@"--smoke-test"]) {
 NSString *script=[NSString stringWithContentsOfURL:[[NSBundle mainBundle] URLForResource:@"smoke" withExtension:@"js"] encoding:NSUTF8StringEncoding error:nil];
 [webView evaluateJavaScript:script completionHandler:nil];
 }
#endif
}
- (void)userContentController:(WKUserContentController *)controller didReceiveScriptMessage:(WKScriptMessage *)message {
 if (![message.body isKindOfClass:NSDictionary.class]) return;
#if TARGET_OS_SIMULATOR
 if([message.name isEqualToString:@"smoke"]) {
 NSURL *dir=[NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
 [[NSJSONSerialization dataWithJSONObject:message.body options:NSJSONWritingPrettyPrinted error:nil] writeToURL:[dir URLByAppendingPathComponent:@"native-smoke.json"] atomically:YES]; return;
 }
#endif
 NSString *text=message.body[@"text"], *name=[message.body[@"name"] lastPathComponent];
 if (![text isKindOfClass:NSString.class] || ![name isKindOfClass:NSString.class] || text.length>10000000) return;
 NSURL *dir=[NSFileManager.defaultManager URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask].firstObject;
 NSURL *file=[dir URLByAppendingPathComponent:name.length?name:@"Lemonade-save.json"];
 NSError *error=nil; [text writeToURL:file atomically:YES encoding:NSUTF8StringEncoding error:&error];
 if(error) return;
 UIActivityViewController *share=[[UIActivityViewController alloc] initWithActivityItems:@[file] applicationActivities:nil];
 share.popoverPresentationController.sourceView=self.view; share.popoverPresentationController.sourceRect=CGRectMake(self.view.bounds.size.width/2,self.view.bounds.size.height-50,1,1);
 [self presentViewController:share animated:YES completion:nil];
}
- (void)webViewWebContentProcessDidTerminate:(WKWebView *)webView { [webView reload]; }
@end
@interface LemonadeScene : UIResponder <UIWindowSceneDelegate>
@property(nonatomic,strong) UIWindow *window;
@end
@implementation LemonadeScene
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
 self.window=[[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene]; self.window.rootViewController=[LemonadeController new]; [self.window makeKeyAndVisible];
}
@end
@interface LemonadeApp : UIResponder <UIApplicationDelegate>
@end
@implementation LemonadeApp
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options { return YES; }
@end
int main(int argc,char **argv) { @autoreleasepool { return UIApplicationMain(argc,argv,nil,NSStringFromClass(LemonadeApp.class)); } }
