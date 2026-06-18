declare module 'speakeasy' {
  export interface GenerateSecretOptions {
    name?: string;
    length?: number;
    issuer?: string;
  }
  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
    google_auth_qr?: string;
  }
  export interface TotpVerifyOptions {
    secret: string;
    encoding: 'base32' | 'ascii' | 'hex';
    token: string;
    window?: number;
    step?: number;
  }
  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
  export namespace totp {
    function verify(options: TotpVerifyOptions): boolean;
  }
}
