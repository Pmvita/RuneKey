// Logger utility for navigation and button press tracking
export const logger = {
  // Navigation logging
  logNavigation: (screenName: string, params?: any) => {
    console.log(`🚀 NAVIGATION: Navigated to ${screenName}`, params ? `with params: ${JSON.stringify(params)}` : '');
  },

  // Button press logging
  logButtonPress: (buttonName: string, action: string, additionalInfo?: any) => {
    console.log(`🔘 BUTTON: ${buttonName} - ${action}`, additionalInfo ? `(${JSON.stringify(additionalInfo)})` : '');
  },

  // Tab navigation logging
  logTabNavigation: (tabName: string) => {
    console.log(`📱 TAB: Switched to ${tabName} tab`);
  },

  // Screen focus logging
  logScreenFocus: (screenName: string) => {
    console.log(`👁️ SCREEN: ${screenName} screen focused`);
  },

  // Error logging
  logError: (context: string, error: any) => {
    console.error(`❌ ERROR in ${context}:`, error);
  }
}; 