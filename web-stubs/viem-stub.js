// Stub for viem on web platform
// This prevents import.meta errors when viem is conditionally imported
// Must not use import.meta syntax!

const stubFunction = () => null;
const stubString = () => '0';
const stubAccount = () => ({
  address: '0x0000000000000000000000000000000000000000',
});

module.exports = {
  createPublicClient: stubFunction,
  createWalletClient: stubFunction,
  http: stubFunction,
  parseEther: stubString,
  formatEther: stubString,
  generatePrivateKey: stubString,
  privateKeyToAccount: stubAccount,
  mainnet: { id: 1, name: 'Ethereum' },
  polygon: { id: 137, name: 'Polygon' },
  bsc: { id: 56, name: 'BSC' },
  avalanche: { id: 43114, name: 'Avalanche' },
  arbitrum: { id: 42161, name: 'Arbitrum' },
  optimism: { id: 10, name: 'Optimism' },
};
