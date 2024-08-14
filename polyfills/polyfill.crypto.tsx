import QuickCrypto from 'react-native-quick-crypto' // should have getRandomValues defined
import { Buffer } from '@craftzdog/react-native-buffer';

// Consider extending the polyfill to other methods
// in order to have a cleaner implementation regarding crypto actions

if (typeof global.crypto !== 'object') {
  // @ts-expect-error subtle isn't fully implemented and Cryptokey is missing
  global.crypto = QuickCrypto
  
}

if(typeof global.Buffer !== 'object') {
    // @ts-expect-error copyBytesFrom and poolSizets are missing from react-native-buffer
    global.Buffer = Buffer;
}

if (typeof global.crypto.getRandomValues !== 'function') {
  global.crypto.getRandomValues = QuickCrypto.randomFillSync
}

function getRandomValues(array: any) {
  return QuickCrypto.randomFillSync(array)
}