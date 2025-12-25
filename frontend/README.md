# Encrypted Salary Compare - Frontend

Modern web interface for the Encrypted Salary Compare application built with Next.js and Rainbow Kit.

## 🎨 Features

- **Modern UI**: Beautiful and responsive design with Tailwind CSS
- **Rainbow Wallet**: Easy wallet connection with Rainbow Kit
- **Real-time Updates**: Live status updates during transactions
- **FHE Integration**: Seamless integration with FHEVM for encryption/decryption
- **Type Safety**: Full TypeScript support

## 🚀 Getting Started

### Development Mode

For development with mock FHEVM (faster, no real blockchain needed):

```bash
npm run dev:mock
```

For development with local Hardhat node:

```bash
# Terminal 1: Start Hardhat node
cd ..
npx hardhat node

# Terminal 2: Start frontend
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 📦 Dependencies

### Core
- **Next.js 15**: React framework
- **React 19**: UI library
- **TypeScript**: Type safety

### Web3
- **Rainbow Kit**: Wallet connection
- **Wagmi**: Ethereum hooks
- **Viem**: Ethereum interactions
- **Ethers.js**: Blockchain utilities

### FHEVM
- **@zama-fhe/relayer-sdk**: FHE operations
- **@fhevm/mock-utils**: Development utilities

### UI
- **Tailwind CSS**: Styling
- **class-variance-authority**: Component variants

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx           # Root layout with Rainbow Kit
│   ├── page.tsx             # Home page
│   ├── providers.tsx        # App providers
│   └── globals.css          # Global styles
├── components/
│   ├── SalaryCompareDemo.tsx    # Main application component
│   └── ErrorNotDeployed.tsx    # Error display component
├── hooks/
│   ├── useSalaryCompare.tsx    # Salary compare contract hook
│   ├── useInMemoryStorage.tsx  # Storage hook
│   └── metamask/               # MetaMask integration hooks
├── fhevm/
│   ├── useFhevm.tsx           # FHEVM instance hook
│   ├── FhevmDecryptionSignature.ts  # Decryption signatures
│   └── internal/              # FHEVM internal utilities
├── abi/
│   ├── SalaryCompareABI.ts    # Contract ABI
│   └── SalaryCompareAddresses.ts  # Deployed addresses
├── public/
│   ├── salary-logo.svg        # Application logo
│   └── salary-icon.png        # Favicon
└── wagmi.config.ts            # Wagmi configuration
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

Get your project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).

### Wagmi Configuration

Edit `wagmi.config.ts` to configure supported chains:

```typescript
export const config = getDefaultConfig({
  appName: 'Encrypted Salary Compare',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains: [sepolia, mockChain],
  ssr: true,
});
```

## 🎯 Key Components

### SalaryCompareDemo

Main application component that handles:
- Salary submission and encryption
- Salary comparison
- Result decryption
- UI state management

### useSalaryCompare Hook

Custom hook providing:
- Contract interaction methods
- Encryption/decryption utilities
- Transaction state management
- Error handling

### useFhevm Hook

Manages FHEVM instance:
- Instance creation
- Public key handling
- Encryption operations

## 🎨 Styling

The app uses Tailwind CSS with custom gradients and components:

- **Color Scheme**: Blue and Indigo gradients
- **Components**: Cards, buttons, inputs with consistent styling
- **Responsive**: Mobile-first design
- **Animations**: Smooth transitions and hover effects

## 🔐 Security Considerations

1. **Client-Side Encryption**: All salary data is encrypted before transmission
2. **Secure Storage**: Decryption signatures stored securely in memory
3. **No Plaintext**: Actual salary values never transmitted in plaintext
4. **Access Control**: Only authorized users can decrypt results

## 📱 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (limited)
- Mobile browsers with Web3 wallet support

## 🧪 Testing

Run component tests:

```bash
npm test
```

## 🛠️ Development Tips

### Generate ABI Files

After deploying contracts:

```bash
npm run genabi
```

This automatically generates:
- `abi/SalaryCompareABI.ts`
- `abi/SalaryCompareAddresses.ts`

### Hot Reload

The development server supports hot module replacement. Changes to components are reflected immediately.

### Type Checking

Run TypeScript type checking:

```bash
npx tsc --noEmit
```

## 📦 Building for Production

```bash
npm run build
```

This creates an optimized production build in `.next/`.

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform supporting Next.js:
- Netlify
- AWS Amplify
- Docker

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure MetaMask or compatible wallet is installed
- Check that you're on the correct network
- Try clearing browser cache

### Contract Not Found
- Run `npm run genabi` to regenerate ABI files
- Ensure contracts are deployed
- Check network configuration

### FHEVM Issues
- For local development, use `npm run dev:mock`
- Ensure relayer SDK is properly initialized
- Check console for detailed error messages

## 📝 License

BSD-3-Clause-Clear License

## 🔗 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Rainbow Kit Docs](https://www.rainbowkit.com/docs)
- [Wagmi Documentation](https://wagmi.sh)
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm)
