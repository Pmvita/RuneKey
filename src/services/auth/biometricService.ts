// RuneKey/src/services/auth/biometricService.ts
import * as LocalAuthentication from 'expo-local-authentication';
import { logger } from '../../utils/logger';

export interface BiometricType {
  available: boolean;
  type: 'fingerprint' | 'facial' | 'iris' | 'none';
  name: string;
}

export class BiometricService {
  private static instance: BiometricService;

  private constructor() {}

  static getInstance(): BiometricService {
    if (!BiometricService.instance) {
      BiometricService.instance = new BiometricService();
    }
    return BiometricService.instance;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return enrolled;
    } catch (error) {
      logger.error('Failed to check biometric availability', error);
      return false;
    }
  }

  async getBiometricType(): Promise<BiometricType> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return {
          available: false,
          type: 'none',
          name: 'Not Available',
        };
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return {
          available: false,
          type: 'none',
          name: 'Not Enrolled',
        };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      
      let biometricType: 'fingerprint' | 'facial' | 'iris' = 'fingerprint';
      let name = 'Biometric';

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'facial';
        name = 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'iris';
        name = 'Iris';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'fingerprint';
        name = 'Touch ID';
      }

      return {
        available: true,
        type: biometricType,
        name,
      };
    } catch (error) {
      logger.error('Failed to get biometric type', error);
      return {
        available: false,
        type: 'none',
        name: 'Error',
      };
    }
  }

  async authenticate(reason?: string): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        logger.warn('Biometric authentication not available');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        logger.info('Biometric authentication successful');
        return true;
      } else {
        logger.info('Biometric authentication cancelled or failed', {
          error: result.error,
        });
        return false;
      }
    } catch (error) {
      logger.error('Biometric authentication error', error);
      return false;
    }
  }

  async authenticateWithFallback(reason?: string): Promise<boolean> {
    try {
      const available = await this.isAvailable();
      if (!available) {
        logger.warn('Biometric authentication not available');
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason || 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
      });

      return result.success;
    } catch (error) {
      logger.error('Biometric authentication error', error);
      return false;
    }
  }
}

export const biometricService = BiometricService.getInstance();

