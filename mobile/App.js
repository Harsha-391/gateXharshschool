import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  BackHandler,
  Platform,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal
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
  return '192.168.1.35';
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
  return 'http://192.168.1.35:5173';
};

const getInitialCloudUrl = () => {
  return process.env.EXPO_PUBLIC_CLOUD_URL || Constants.expoConfig?.extra?.cloudServerUrl || 'https://acadmay.in';
};

const DEFAULT_LOCAL_URL = `http://${detectedIp}:5173`;
const CLOUD_PROD_URL = getInitialCloudUrl();
const EMULATOR_URL = 'http://10.0.2.2:5173';

export default function App() {
  const webViewRef = useRef(null);

  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [serverUrl, setServerUrl] = useState(DEFAULT_LOCAL_URL);
  const [customUrlInput, setCustomUrlInput] = useState(DEFAULT_LOCAL_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'failed'
  const [testMessage, setTestMessage] = useState('');

  // Automatically ensure Expo Go connects to the local machine rather than stale cloud
  useEffect(() => {
    if (serverUrl.includes('acadmay.in')) {
      console.log('[Dev] Resetting to local development server:', DEFAULT_LOCAL_URL);
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
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
    setTimeout(() => setRefreshing(false), 1200);
  };

  const handleSwitchToLocal = () => {
    const localUrl = DEFAULT_LOCAL_URL;
    setCustomUrlInput(localUrl);
    setServerUrl(localUrl);
    setHasError(false);
    setLoading(true);
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  const handleSwitchToCloud = () => {
    setCustomUrlInput(CLOUD_PROD_URL);
    setServerUrl(CLOUD_PROD_URL);
    setHasError(false);
    setLoading(true);
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
    setLoading(true);
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
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" backgroundColor="#0f172a" />

        {/* Top Connection Banner */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 6,
          backgroundColor: serverUrl.includes('acadmay.in') ? '#7c2d12' : '#1e293b',
          borderBottomWidth: 1,
          borderBottomColor: '#334155'
        }}>
          <Text style={{ fontSize: 11, color: '#cbd5e1', flex: 1 }} numberOfLines={1}>
            Target: <Text style={{ color: serverUrl.includes('acadmay.in') ? '#fca5a5' : '#38bdf8', fontWeight: 'bold' }}>{serverUrl}</Text>
          </Text>
          {serverUrl.includes('acadmay.in') ? (
            <TouchableOpacity 
              onPress={handleSwitchToLocal}
              style={{ backgroundColor: '#0284c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>🏠 Switch to Local ({detectedIp})</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleRefresh}
              style={{ backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}
            >
              <Text style={{ color: '#f8fafc', fontSize: 11, fontWeight: '600' }}>🔄 Reload</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Main WebView */}
        {!hasError ? (
          <View style={styles.webViewContainer}>
            <WebView
              ref={webViewRef}
              source={{ uri: serverUrl }}
              style={styles.webView}
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
              onLoadStart={() => setLoading(true)}
              onLoadEnd={() => setLoading(false)}
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
                setLoading(false);
                setHasError(true);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView HTTP error:', nativeEvent.statusCode);
                if (nativeEvent.statusCode >= 500 && (nativeEvent.url === serverUrl || nativeEvent.url === serverUrl + '/')) {
                  setHasError(true);
                }
              }}
            />

            {/* Loading Overlay */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#38bdf8" />
                <Text style={styles.loadingText}>Connecting to School ERP...</Text>
                <Text style={styles.loadingSubtext}>{serverUrl}</Text>
              </View>
            )}
          </View>
        ) : (
          /* Error & Offline Fallback View */
          <ScrollView
            contentContainerStyle={styles.errorContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#38bdf8" />
            }
          >
            <View style={styles.errorIconBadge}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Connection Failed</Text>
            <Text style={styles.errorDescription}>
              Unable to reach the School ERP server at:
            </Text>
            <Text style={styles.errorUrl}>{serverUrl}</Text>
            
            <View style={styles.errorHint}>
              <Text style={styles.hintTitle}>Select a Connection Option:</Text>
              <Text style={styles.hintText}>
                • <Text style={{ fontWeight: '700', color: '#38bdf8' }}>Local Wi-Fi</Text>: Fast local development ({detectedIp}:5173){"\n"}
                • <Text style={{ fontWeight: '700', color: '#a855f7' }}>Cloud Server</Text>: Connect to acadmay.in live cloud{"\n"}
                • <Text style={{ fontWeight: '700', color: '#f59e0b' }}>Custom Tunnel</Text>: Enter active Cloudflare / Ngrok URL
              </Text>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSwitchToLocal}>
                <Text style={styles.primaryButtonText}>🏠 Switch to Local Wi-Fi ({detectedIp})</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cloudButton} onPress={handleSwitchToCloud}>
                <Text style={styles.cloudButtonText}>☁️ Switch to Cloud Server (acadmay.in)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleRefresh}>
                <Text style={styles.secondaryButtonText}>🔄 Retry Connection</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineButton} onPress={() => { setTestStatus(null); setShowSettings(true); }}>
                <Text style={styles.outlineButtonText}>⚙️ Enter Custom Tunnel / Server URL</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Persistent Floating Settings Button */}
        <TouchableOpacity
          style={styles.floatingSettingsBtn}
          onPress={() => { setTestStatus(null); setShowSettings(true); }}
          activeOpacity={0.8}
        >
          <Text style={styles.floatingSettingsText}>⚙️</Text>
        </TouchableOpacity>

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
                    style={[styles.presetBtn, (customUrlInput === DEFAULT_LOCAL_URL || customUrlInput === `http://${detectedIp}:5173`) && styles.presetBtnActive]}
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
                placeholder={`e.g. http://${detectedIp}:5173 or https://acadmay.in`}
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
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  loadingSubtext: {
    marginTop: 6,
    fontSize: 12,
    color: '#94a3b8',
  },
  errorContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
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
  },
  errorUrl: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38bdf8',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  errorHint: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 8,
  },
  hintText: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 20,
  },
  buttonRow: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cloudButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  cloudButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  floatingSettingsBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  floatingSettingsText: {
    fontSize: 20,
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
