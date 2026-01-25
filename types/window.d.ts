interface Window {
  solana?: {
    isPhantom?: boolean;
    connect: () => Promise<{ publicKey: { toString: () => string } }>;
    disconnect: () => Promise<void>;
    signMessage: (
      message: Uint8Array,
      encoding: string
    ) => Promise<{ signature: Uint8Array }>;
    on: (event: string, callback: () => void) => void;
    request: (args: { method: string }) => Promise<any>;
  };
}
