/**
 * Global type declarations for APIs available in Hermes (React Native 0.73+)
 * but not included in the default @react-native/typescript-config.
 */

// TextEncoder/TextDecoder (available in Hermes)
declare class TextEncoder {
  encode(input?: string): Uint8Array;
}

declare class TextDecoder {
  decode(input?: ArrayBuffer | ArrayBufferView): string;
}

// Web Crypto API subset (available in Hermes)
interface SubtleCrypto {
  digest(algorithm: string, data: ArrayBuffer): Promise<ArrayBuffer>;
}

interface Crypto {
  subtle: SubtleCrypto;
  getRandomValues<T extends ArrayBufferView>(array: T): T;
}

declare var crypto: Crypto;
