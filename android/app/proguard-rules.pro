# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
#-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
#-renamesourcefileattribute SourceFile

# Capacitor plugins are called by name from JS and some look up classes by
# reflection. Capacitor core keeps Plugin subclasses; keep the plugin packages
# whole so helpers, listeners and reflective lookups survive R8.
-keep class com.getcapacitor.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep class ee.forgr.** { *; }
-keep class app.capgo.** { *; }

# @capgo/capacitor-updater ships these rules but does not declare them as
# consumer rules.
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
-keep class * implements com.getcapacitor.PluginHandle {
    public void invoke(java.lang.String, com.getcapacitor.PluginCall);
}

# Reflective lookups: updater (androidx.webkit), native-audio (HLS).
-keep class androidx.webkit.WebViewFeature { *; }
-keep class androidx.webkit.WebViewCompat { *; }
-keep class androidx.media3.exoplayer.hls.HlsMediaSource { *; }
-keep class androidx.media3.exoplayer.hls.HlsMediaSource$Factory { *; }

# Readable crash stack traces in Play Console.
-keepattributes SourceFile,LineNumberTable
