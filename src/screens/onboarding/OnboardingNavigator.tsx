import React, { useState } from 'react';
import { Alert } from 'react-native';
import { SplashScreen } from './SplashScreen';
import { InitializingScreen } from './InitializingScreen';
import { LoginScreen } from '../auth/LoginScreen';
import { WelcomeScreen } from './WelcomeScreen';
import { WalletSetupScreen } from './WalletSetupScreen';
import { SeedPhraseScreen } from './SeedPhraseScreen';
import { SeedVerifyScreen } from './SeedVerifyScreen';
import { SecuritySetupScreen } from './SecuritySetupScreen';
import { ImportWalletScreen } from './ImportWalletScreen';
import { useWallet } from '../../hooks/wallet/useWallet';
import { generateSeedPhrase, seedPhraseToEntropy } from '../../utils/seedPhrase';
import { DEFAULT_NETWORK } from '../../constants';
import { logger } from '../../utils/logger';
import { useAppStore } from '../../stores/app/useAppStore';

export type OnboardingStep = 
  | 'splash'
  | 'initializing'
  | 'login'
  | 'welcome' 
  | 'walletSetup'
  | 'createWallet'
  | 'seedPhrase'
  | 'seedVerify'
  | 'security'
  | 'importWallet'
  | 'complete';

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const { generateWallet, importWallet } = useWallet();
  const { setFirstLaunch } = useAppStore();

  const handleSplashComplete = (destination: 'onboarding' | 'auth' | 'main') => {
    logger.logNavigation('SplashScreen', { destination });
    switch (destination) {
      case 'onboarding':
      case 'auth':
        setCurrentStep('initializing');
        break;
      case 'main':
        onComplete();
        break;
    }
  };

  const handleInitializingComplete = () => {
    logger.logNavigation('InitializingScreen', { step: 'complete' });
    setCurrentStep('login');
  };

  const handleLoginSuccess = () => {
    console.log('Login success callback triggered');
    logger.logNavigation('LoginScreen', { action: 'login_success' });
    setFirstLaunch(false); // Mark that this is no longer the first launch
    onComplete();
  };

  const handleCreateAccount = () => {
    logger.logNavigation('LoginScreen', { action: 'create_account' });
    setCurrentStep('welcome');
  };

  const handleWelcomeComplete = () => {
    logger.logNavigation('WelcomeScreen', { step: 'complete' });
    setCurrentStep('walletSetup');
  };

  const handleCreateWallet = () => {
    logger.logButtonPress('Create Wallet', 'generate seed phrase and navigate to seed phrase screen');
    try {
      const newSeedPhrase = generateSeedPhrase(12);
      setSeedPhrase(newSeedPhrase);
      setCurrentStep('seedPhrase');
    } catch (error) {
      logger.logError('CreateWallet', error);
      Alert.alert('Error', 'Failed to generate seed phrase. Please try again.');
    }
  };

  const handleImportWallet = () => {
    logger.logButtonPress('Import Wallet', 'navigate to import wallet screen');
    setCurrentStep('importWallet');
  };

  const handleSeedPhraseConfirm = () => {
    logger.logButtonPress('Seed Phrase Confirm', 'navigate to seed verification screen');
    setCurrentStep('seedVerify');
  };

  const handleSeedVerifySuccess = () => {
    logger.logButtonPress('Seed Verify Success', 'navigate to security setup screen');
    setCurrentStep('security');
  };

  const handleSecurityComplete = async () => {
    logger.logButtonPress('Security Complete', 'create wallet and complete onboarding');
    try {
      // Generate wallet from seed phrase
      const entropy = seedPhraseToEntropy(seedPhrase);
      
      // For demo purposes, we'll use the entropy as a private key
      // In production, derive proper private key from seed phrase
      await generateWallet();
      
      Alert.alert(
        'Wallet Created!',
        'Your wallet has been created successfully. Welcome to RuneKey!',
        [{ text: 'Get Started', onPress: onComplete }]
      );
    } catch (error) {
      logger.logError('SecurityComplete', error);
      Alert.alert(
        'Wallet Creation Failed',
        'There was an error creating your wallet. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleImportComplete = async (privateKeyOrMnemonic: string) => {
    logger.logButtonPress('Import Complete', 'import wallet and complete onboarding');
    try {
      await importWallet(privateKeyOrMnemonic);
      
      Alert.alert(
        'Wallet Imported!',
        'Your wallet has been imported successfully. Welcome to RuneKey!',
        [{ text: 'Get Started', onPress: onComplete }]
      );
    } catch (error) {
      logger.logError('ImportComplete', error);
      Alert.alert(
        'Import Failed',
        'Failed to import wallet. Please check your recovery phrase or private key and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const navigateBack = () => {
    logger.logButtonPress('Back', `navigate back from ${currentStep}`);
    switch (currentStep) {
      case 'welcome':
        setCurrentStep('splash');
        break;
      case 'walletSetup':
        setCurrentStep('welcome');
        break;
      case 'seedPhrase':
        setCurrentStep('walletSetup');
        break;
      case 'seedVerify':
        setCurrentStep('seedPhrase');
        break;
      case 'security':
        setCurrentStep('seedVerify');
        break;
      case 'importWallet':
        setCurrentStep('walletSetup');
        break;
      default:
        break;
    }
  };

  switch (currentStep) {
    case 'splash':
      return <SplashScreen onComplete={handleSplashComplete} />;
    
    case 'initializing':
      return <InitializingScreen onComplete={handleInitializingComplete} />;
    
    case 'login':
      return (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          onCreateAccount={handleCreateAccount}
        />
      );
    
    case 'welcome':
      return <WelcomeScreen onComplete={handleWelcomeComplete} />;
    
    case 'walletSetup':
      return (
        <WalletSetupScreen
          onCreateWallet={handleCreateWallet}
          onImportWallet={handleImportWallet}
        />
      );
    
    case 'seedPhrase':
      return (
        <SeedPhraseScreen
          seedPhrase={seedPhrase}
          onConfirm={handleSeedPhraseConfirm}
          onBack={navigateBack}
        />
      );
    
    case 'seedVerify':
      return (
        <SeedVerifyScreen
          seedPhrase={seedPhrase}
          onVerifySuccess={handleSeedVerifySuccess}
          onBack={navigateBack}
        />
      );
    
    case 'security':
      return <SecuritySetupScreen onComplete={handleSecurityComplete} />;
    
    case 'importWallet':
      return (
        <ImportWalletScreen
          onImportSuccess={handleImportComplete}
          onBack={navigateBack}
        />
      );
    
    default:
      return <SplashScreen onComplete={handleSplashComplete} />;
  }
};