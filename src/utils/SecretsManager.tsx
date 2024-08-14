// src/utils/SecretsManager.ts
import * as Keychain from 'react-native-keychain';

class SecretsManager {
  static async setSecret(key: string, secret: string): Promise<void> {
    await Keychain.setGenericPassword(key, secret, {service: key});
  }

  static async getSecret(key: string): Promise<string | null> {
    const credentials = await Keychain.getGenericPassword({service: key});
    return credentials ? credentials.password : null;
  }

  static async deleteSecret(key: string): Promise<void> {
    await Keychain.resetGenericPassword({service: key});
  }
}

export default SecretsManager;
