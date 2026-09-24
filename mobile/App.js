import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  BackHandler,
  Platform,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Share,
  Linking
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';

// Automatically detect developer machine LAN IP when running through Expo Go or build APK
const getDetectedLanIp = () => {
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || '';
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return ip;
    }
  }
  return '192.168.1.28';
};

const detectedIp = getDetectedLanIp();

const getInitialServerUrl = () => {
  if (process.env.EXPO_PUBLIC_DEFAULT_SERVER_URL) {
    return process.env.EXPO_PUBLIC_DEFAULT_SERVER_URL;
  }
  if (detectedIp) {
    return `http://${detectedIp}:5173`;
  }
  if (Constants.expoConfig?.extra?.localServerUrl) {
    return Constants.expoConfig.extra.localServerUrl;
  }
  return 'http://192.168.1.28:5173';
};

const getInitialCloudUrl = () => {
  return process.env.EXPO_PUBLIC_CLOUD_URL || Constants.expoConfig?.extra?.cloudServerUrl || 'https://acadmay.in';
};

const DEFAULT_LOCAL_URL = `http://${detectedIp}:5173`;
const CLOUD_PROD_URL = getInitialCloudUrl();
const EMULATOR_URL = 'http://10.0.2.2:5173';

export default function App() {
  const webViewRef = useRef(null);

  const initialUrl = getInitialServerUrl();
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [serverUrl, setServerUrl] = useState(initialUrl);
  const [customUrlInput, setCustomUrlInput] = useState(initialUrl);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'failed'
  const [testMessage, setTestMessage] = useState('');

  // Automatically ensure Expo Go connects to the local machine rather than stale cloud
  useEffect(() => {
    if (Constants.appOwnership === 'expo' && serverUrl.includes('acadmay.in')) {
      console.log('[Dev] Resetting to local development server in Expo Go:', DEFAULT_LOCAL_URL);
      setServerUrl(DEFAULT_LOCAL_URL);
      setCustomUrlInput(DEFAULT_LOCAL_URL);
    }
  }, []);

  // Handle Android hardware back button
  useEffect(() => {
    if (Platform.OS === 'android') {
      const onBackPress = () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }
  }, [canGoBack]);

  const handleRefresh = () => {
    setRefreshing(true);
    setHasError(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const handleSwitchToLocal = () => {
    const localUrl = DEFAULT_LOCAL_URL;
    setCustomUrlInput(localUrl);
    setServerUrl(localUrl);
    setHasError(false);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleSwitchToCloud = () => {
    setCustomUrlInput(CLOUD_PROD_URL);
    setServerUrl(CLOUD_PROD_URL);
    setHasError(false);
  };

  const handleSaveUrl = () => {
    let url = customUrlInput.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    url = url.replace(/\/+$/, '');
    setServerUrl(url);
    setShowSettings(false);
    setHasError(false);
    setTestStatus(null);
  };

  const testConnection = async (targetUrl) => {
    let url = (targetUrl || customUrlInput).trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url;
    }
    url = url.replace(/\/+$/, '');
    
    setTestStatus('testing');
    setTestMessage('Pinging server...');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      const res = await fetch(`${url}/api/school`, { 
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok || res.status === 200 || res.status === 404 || res.status === 401) {
        setTestStatus('success');
        setTestMessage('✓ Connected! Server is reachable.');
      } else {
        setTestStatus('success');
        setTestMessage(`✓ Server responded with HTTP ${res.status}.`);
      }
    } catch (err) {
      setTestStatus('failed');
      setTestMessage('✕ Connection timed out. Check Wi-Fi or tunnel URL.');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" backgroundColor="#ffffff" />

        {/* Main WebView */}
        {!hasError ? (
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: serverUrl }}
              style={styles.webView}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#f97316" />
                </View>
              )}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              allowFileAccess={true}
              allowFileAccessFromFileURLs={true}
              allowUniversalAccessFromFileURLs={true}
              cacheEnabled={false}
              cacheMode="LOAD_NO_CACHE"
              mixedContentMode="always"
              originWhitelist={['*']}
              showsHorizontalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
              scalesPageToFit={false}
              injectedJavaScriptBeforeContentLoaded={`
                (function() {
                  try {
                    let meta = document.querySelector('meta[name="viewport"]');
                    if (!meta) {
                      meta = document.createElement('meta');
                      meta.name = 'viewport';
                      document.head.appendChild(meta);
                    }
                    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                  } catch (e) {}
                })();
                true;
              `}
              injectedJavaScript={`
                (function() {
                  try {
                    let meta = document.querySelector('meta[name="viewport"]');
                    if (!meta) {
                      meta = document.createElement('meta');
                      meta.name = 'viewport';
                      document.head.appendChild(meta);
                    }
                    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                    document.documentElement.style.overflowX = 'hidden';
                    document.documentElement.style.maxWidth = '100vw';
                    document.documentElement.style.width = '100%';
                    document.body.style.overflowX = 'hidden';
                    document.body.style.maxWidth = '100vw';
                    document.body.style.width = '100%';
                    
                    let mobileStyle = document.getElementById('mobile-webview-safeguard');
                    if (!mobileStyle) {
                      mobileStyle = document.createElement('style');
                      mobileStyle.id = 'mobile-webview-safeguard';
                      document.head.appendChild(mobileStyle);
                    }
                    mobileStyle.innerHTML = \`
                      html, body, #root, .app-container {
                        max-width: 100vw !important;
                        overflow-x: hidden !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                      }
                      .app-content {
                        padding: 12px 10px !important;
                        width: 100% !important;
                        max-width: 100vw !important;
                        overflow-x: hidden !important;
                        box-sizing: border-box !important;
                      }
                      .saas-home-sections-grid {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                        width: 100% !important;
                        max-width: 100% !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                      }
                      .saas-home-sections-grid > * {
                        width: 100% !important;
                        max-width: 100% !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                      }
                      .saas-home-section-card {
                        width: 100% !important;
                        max-width: 100% !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                        padding: 16px 14px !important;
                        gap: 14px !important;
                        display: flex !important;
                        flex-direction: column !important;
                      }
                      .saas-deck-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                        width: 100% !important;
                      }
                      .saas-metrics-subgrid {
                        grid-template-columns: 1fr !important;
                        gap: 14px !important;
                        width: 100% !important;
                      }
                      .saas-kpi-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        width: 100% !important;
                      }
                      .chart-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                      }
                      .activity-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                      }
                      .dashboard-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                      }
                      /* Admin & School Overview Safeguards */
                      .admin-overview-header-row {
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 12px !important;
                        width: 100% !important;
                      }
                      .admin-overview-counts-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        gap: 10px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                      }
                      .admin-overview-count-card {
                        padding: 12px 10px !important;
                        gap: 8px !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                        border-radius: 14px !important;
                      }
                      .admin-overview-card-icon {
                        width: 36px !important;
                        height: 36px !important;
                        min-width: 36px !important;
                        flex-shrink: 0 !important;
                        border-radius: 8px !important;
                      }
                      .admin-overview-card-num {
                        font-size: 1.5rem !important;
                        line-height: 1.1 !important;
                      }
                      .admin-overview-ratios-grid {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                      }
                      .admin-overview-ratio-card {
                        padding: 14px 12px !important;
                        width: 100% !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                        border-radius: 14px !important;
                      }
                      .admin-overview-items-grid {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                      }
                      /* Generic safeguard for any 4-col overview grids on mobile */
                      div[style*="repeat(4, 1fr)"],
                      div[style*="repeat(4,1fr)"] {
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                      }
                      /* Universal mobile scrollbar suppression */
                      * {
                        scrollbar-width: none !important;
                        -ms-overflow-style: none !important;
                      }
                      *::-webkit-scrollbar {
                        display: none !important;
                        width: 0 !important;
                        height: 0 !important;
                      }
                      /* Tab strips & sub-tabs flex-fit in 1 row */
                      .gm-tab-strip,
                      .admin-subtab-strip {
                        display: flex !important;
                        padding: 4px !important;
                        gap: 4px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                        overflow-x: auto !important;
                      }
                      .gm-tab-btn,
                      .admin-subtab-btn {
                        flex: 1 1 0px !important;
                        min-width: 0 !important;
                        justify-content: center !important;
                        text-align: center !important;
                        padding: 7px 4px !important;
                        font-size: 0.74rem !important;
                        gap: 4px !important;
                        white-space: nowrap !important;
                      }
                      /* Tables & table cell compact sizing */
                      .gm-table-container,
                      .custom-table-container,
                      .gm-table-wrapper {
                        width: 100% !important;
                        max-width: 100% !important;
                        box-sizing: border-box !important;
                        overflow-x: auto !important;
                        -webkit-overflow-scrolling: touch !important;
                      }
                      .custom-table th,
                      .table-custom th,
                      .gm-th,
                      .gm-table th,
                      table th {
                        padding: 8px 6px !important;
                        font-size: 0.72rem !important;
                      }
                      .custom-table td,
                      .table-custom td,
                      .gm-td,
                      .gm-table td,
                      table td {
                        padding: 8px 6px !important;
                        font-size: 0.76rem !important;
                      }
                      .gm-th-check,
                      .gm-td-check {
                        width: 30px !important;
                        padding: 8px 4px !important;
                      }
                      .gm-search-wrap {
                        max-width: 100% !important;
                        width: 100% !important;
                      }
                      /* Multi-column minmax cards to single column */
                      div[style*="repeat(auto-fill, minmax(280px"],
                      div[style*="repeat(auto-fill, minmax(300px"],
                      div[style*="repeat(auto-fill, minmax(320px"],
                      div[style*="repeat(auto-fit, minmax(280px"],
                      div[style*="repeat(auto-fit, minmax(300px"],
                      div[style*="repeat(auto-fit, minmax(320px"] {
                        grid-template-columns: 1fr !important;
                      }
                      .app-sidebar:not(.mobile-open) {
                        display: none !important;
                        transform: translateX(-110%) !important;
                        width: 0 !important;
                        padding: 0 !important;
                        visibility: hidden !important;
                        pointer-events: none !important;
                      }
                      .app-sidebar.mobile-open {
                        position: fixed !important;
                        top: 0 !important;
                        left: 0 !important;
                        bottom: 0 !important;
                        height: 100vh !important;
                        height: 100dvh !important;
                        width: 290px !important;
                        max-width: 85vw !important;
                        z-index: 999999 !important;
                        transform: translateX(0) !important;
                        visibility: visible !important;
                        pointer-events: auto !important;
                        display: flex !important;
                        box-shadow: 12px 0 40px rgba(0, 0, 0, 0.4) !important;
                      }
                    \`;
                  } catch (e) {}
                })();
                true;
              `}
              onNavigationStateChange={(navState) => {
                setCanGoBack(navState.canGoBack);
              }}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error:', nativeEvent);
                if (
                  nativeEvent.code === -999 || 
                  nativeEvent.description?.includes('net::ERR_ABORTED') ||
                  nativeEvent.description?.includes('net::ERR_BLOCKED_BY_CLIENT')
                ) {
                  return;
                }
                setHasError(true);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView HTTP error:', nativeEvent.statusCode);
                if (nativeEvent.statusCode >= 500 && (nativeEvent.url === serverUrl || nativeEvent.url === serverUrl + '/')) {
                  setHasError(true);
                }
              }}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === 'DOWNLOAD_PDF' || data.type === 'DOWNLOAD_FILE_URL') {
                    if (data.url) {
                      Linking.openURL(data.url).catch(err => {
                        console.warn('Linking.openURL failed for download:', err);
                        // Fallback to native share sheet if browser cannot open link
                        Share.share({
                          title: data.title || 'Official Academic Document',
                          message: `${data.title || 'Academic Document'}\n\n${data.content || ''}\n\nDownload Link: ${data.url}`
                        });
                      });
                    } else if (data.content) {
                      Share.share({
                        title: data.title || 'Official Academic Document',
                        message: `${data.title || 'Official Document'}\n\n${data.content || ''}`
                      });
                    }
                  } else if (data.type === 'EXPORT_DOCUMENT' || data.type === 'SHARE_DOCUMENT') {
                    Share.share({
                      title: data.title || 'Official Academic Document',
                      message: `${data.title || 'Official Document'}\n\n${data.content || ''}${data.url ? `\n\nDownload: ${data.url}` : ''}`
                    });
                  }
                } catch (e) {}
              }}
            />
          </View>
        ) : (
          /* Error & Offline Fallback View */
          <ScrollView
            contentContainerStyle={styles.errorContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f97316" />
            }
          >
            <View style={styles.errorIconBadge}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorDescription}>
              Unable to reach the Acadmay School ERP server. Please verify your internet or Wi-Fi connection and tap below to retry.
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleRefresh}>
                <Text style={styles.primaryButtonText}>🔄 Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.ghostButton} 
                onPress={() => { setTestStatus(null); setShowSettings(true); }}
              >
                <Text style={styles.ghostButtonText}>⚙️ Server Settings</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Server URL Config Modal */}
        <Modal visible={showSettings} transparent={true} animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Server Configuration</Text>
              <Text style={styles.modalSubtitle}>
                Select a server preset or enter your custom tunnel/IP address:
              </Text>

              {/* Currently Active Server Indicator */}
              <View style={{
                marginBottom: 14,
                padding: 10,
                borderRadius: 10,
                backgroundColor: 'rgba(56, 189, 248, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(56, 189, 248, 0.25)'
              }}>
                <Text style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 }}>
                  Active Web Target:
                </Text>
                <Text style={{ fontSize: 13, color: '#38bdf8', fontWeight: '700', marginTop: 3 }}>
                  {serverUrl}
                </Text>
                <Text style={{ fontSize: 11, color: serverUrl.includes('acadmay.in') ? '#f59e0b' : '#10b981', marginTop: 2, fontWeight: '600' }}>
                  {serverUrl.includes('acadmay.in') ? '☁️ Cloud Server (Remote DB - 0 schools)' : '🏠 Local Machine (Live DB - 1 school: IIS)'}
                </Text>
              </View>

              <View style={styles.presetContainer}>
                <Text style={styles.presetLabel}>Quick Presets:</Text>
                
                <View style={styles.presetRow}>
                  <TouchableOpacity
                    style={[styles.presetBtn, customUrlInput === DEFAULT_LOCAL_URL && styles.presetBtnActive]}
                    onPress={() => { 
                      const localUrl = DEFAULT_LOCAL_URL;
                      setCustomUrlInput(localUrl); 
                      testConnection(localUrl); 
                    }}
                  >
                    <Text style={styles.presetBtnText}>🏠 Local Wi-Fi</Text>
                    <Text style={styles.presetBtnSubtext}>{detectedIp}:5173</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.presetBtn, customUrlInput === CLOUD_PROD_URL && styles.presetBtnActive]}
                    onPress={() => { 
                      setCustomUrlInput(CLOUD_PROD_URL); 
                      testConnection(CLOUD_PROD_URL); 
                    }}
                  >
                    <Text style={styles.presetBtnText}>☁️ Cloud Server</Text>
                    <Text style={styles.presetBtnSubtext}>acadmay.in</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.presetRow, { marginTop: 8 }]}>
                  <TouchableOpacity
                    style={[styles.presetBtn, customUrlInput === EMULATOR_URL && styles.presetBtnActive]}
                    onPress={() => { 
                      setCustomUrlInput(EMULATOR_URL); 
                      testConnection(EMULATOR_URL); 
                    }}
                  >
                    <Text style={styles.presetBtnText}>💻 Emulator</Text>
                    <Text style={styles.presetBtnSubtext}>10.0.2.2:5173</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.presetBtn, customUrlInput.includes('trycloudflare') && styles.presetBtnActive]}
                    onPress={() => { 
                      setCustomUrlInput('https://'); 
                      setTestStatus(null);
                    }}
                  >
                    <Text style={styles.presetBtnText}>⚡ Tunnel</Text>
                    <Text style={styles.presetBtnSubtext}>Cloudflare/Ngrok</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.inputLabel}>Server URL / Endpoint:</Text>
              <TextInput
                style={styles.input}
                value={customUrlInput}
                onChangeText={(text) => { setCustomUrlInput(text); setTestStatus(null); }}
                placeholder="e.g. http://192.168.1.28:5173 or https://acadmay.in"
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              {/* Test Connection Button & Status */}
              <View style={styles.testRow}>
                <TouchableOpacity
                  style={styles.testBtn}
                  onPress={() => testConnection()}
                  disabled={testStatus === 'testing'}
                >
                  {testStatus === 'testing' ? (
                    <ActivityIndicator size="small" color="#38bdf8" />
                  ) : (
                    <Text style={styles.testBtnText}>⚡ Test Connection</Text>
                  )}
                </TouchableOpacity>

                {testStatus && testStatus !== 'testing' && (
                  <Text style={[styles.testResultText, testStatus === 'success' ? styles.testSuccess : styles.testFail]}>
                    {testMessage}
                  </Text>
                )}
              </View>

              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalSaveBtn]}
                  onPress={handleSaveUrl}
                >
                  <Text style={styles.modalSaveText}>Save & Connect</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webViewContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  webView: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#ffffff',
  },
  errorIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 32,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    width: '100%',
    maxWidth: 320,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#f97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
  },
  ghostButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 18,
  },
  presetContainer: {
    marginBottom: 14,
  },
  presetLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  presetBtnActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  presetBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  presetBtnSubtext: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 12,
  },
  testRow: {
    marginBottom: 18,
  },
  testBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8',
    alignSelf: 'flex-start',
  },
  testBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  testResultText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  testSuccess: {
    color: '#4ade80',
  },
  testFail: {
    color: '#f87171',
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  modalCancelBtn: {
    backgroundColor: '#334155',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#0284c7',
  },
  modalSaveText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
