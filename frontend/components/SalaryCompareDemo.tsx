"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useSalaryCompare } from "@/hooks/useSalaryCompare";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { SalaryDashboard } from "./SalaryDashboard";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";

function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export const SalaryCompareDemo = () => {
  // Memoize expensive computations with unified color theme
  const buttonClass = useMemo(() => (
    "inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg " +
    "transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 hover:scale-105 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:transform-none"
  ), []);

  const inputClass = useMemo(() => (
    "w-full px-4 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 focus:border-indigo-500 dark:focus:border-indigo-400 " +
    "focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-300 outline-none " +
    "text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-700 " +
    "hover:border-indigo-400 dark:hover:border-indigo-500"
  ), []);

  const cardClass = useMemo(() => (
    "bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 " +
    "transition-all duration-300 hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-700 " +
    "backdrop-blur-sm bg-gradient-to-br from-white/95 to-white/90 dark:from-gray-800/95 dark:to-gray-800/90"
  ), []);

  // State for decryption visual effects
  const [decryptionEffect, setDecryptionEffect] = useState<'none' | 'high' | 'low'>('none');
  const [showDashboard, setShowDashboard] = useState(true);
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const { isConnected } = useAccount();
  const {
    provider,
    chainId,
    accounts,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const [salaryInput, setSalaryInput] = useState<string>("");
  const [compareAddress, setCompareAddress] = useState<string>("");
  const [retryCount, setRetryCount] = useState<number>(0);

  const handleSalarySubmit = async () => {
    const salary = parseInt(salaryInput);
    const MAX_SALARY = 10000000; // $10M reasonable upper limit

    if (salary > 0 && salary <= MAX_SALARY && salaryCompare.canSubmit) {
      try {
        await salaryCompare.submitSalary(salary);
        setSalaryInput("");
        setRetryCount(0); // Reset retry count on success
      } catch (error) {
        console.error("Failed to submit salary:", error);
        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
          // Auto-retry after a delay
          setTimeout(() => handleSalarySubmit(), 2000);
        }
      }
    }
  };

  // FHEVM instance
  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  // Salary Compare hook
  const salaryCompare = useSalaryCompare({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // Enhanced decryption with visual effects
  const handleDecryptMySalary = async () => {
    if (!salaryCompare.canDecryptSalary || salaryCompare.isDecryptingSalary) {
      console.warn('Cannot decrypt salary:', {
        canDecrypt: salaryCompare.canDecryptSalary,
        isDecrypting: salaryCompare.isDecryptingSalary,
        hasSalary: salaryCompare.hasSalary,
        mySalary: salaryCompare.mySalary,
        isDecrypted: salaryCompare.isSalaryDecrypted,
        contractAddress: salaryCompare.contractAddress,
        fhevmInstance: !!fhevmInstance,
      });
      return;
    }

    try {
      setDecryptionEffect('none');
      console.log('Starting salary decryption...');
      await salaryCompare.decryptMySalary();
      
      // Wait a bit for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (salaryCompare.clearMySalary) {
        const salary = Number(salaryCompare.clearMySalary);
        console.log('Salary decrypted successfully:', salary);
        // Determine if salary is high or low based on average (using $87,500 as reference)
        if (salary >= 87500) {
          setDecryptionEffect('high');
        } else {
          setDecryptionEffect('low');
        }
        // Reset effect after animation
        setTimeout(() => setDecryptionEffect('none'), 3000);
      } else {
        console.warn('Decryption completed but no clear salary value');
      }
    } catch (error) {
      console.error('Error decrypting salary:', error);
    }
  };

  const handleDecryptComparison = async () => {
    setDecryptionEffect('none');
    await salaryCompare.decryptComparisonResult();
    if (salaryCompare.clearComparisonResult !== undefined) {
      // true means you earn more (high), false means you earn less (low)
      setDecryptionEffect(salaryCompare.clearComparisonResult ? 'high' : 'low');
      setTimeout(() => setDecryptionEffect('none'), 3000);
    }
  };



  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-fade-in">
        <div className="text-center animate-slide-up">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome to Encrypted Salary Compare
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compare salaries privately without revealing actual numbers using Fully Homomorphic Encryption (FHE).
            Connect your wallet to get started.
          </p>
        </div>
        <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-xl border border-indigo-100 animate-scale-in">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4 animate-rotate-in">🔒</div>
            <h3 className="text-xl font-semibold text-gray-800">Privacy First</h3>
            <p className="text-gray-600">
              Your salary data is encrypted end-to-end. Only you can decrypt your information.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (salaryCompare.isDeployed === false) {
    return errorNotDeployed(chainId);
  }

  return (
    <div className="grid w-full gap-6 mt-6">
      {/* Dashboard Toggle */}
      <div className="flex items-center justify-between animate-fade-in">
        <div className={`${cardClass} bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 dark:from-indigo-900/20 dark:to-purple-900/20 dark:border-indigo-700 animate-slide-down`}>
          <h2 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-100">Encrypted Salary Compare</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Compare salaries privately using Fully Homomorphic Encryption
          </p>
        </div>
        <button
          onClick={() => setShowDashboard(!showDashboard)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          {showDashboard ? "📊 Hide Dashboard" : "📊 Show Dashboard"}
        </button>
      </div>

      {/* Dashboard */}
      {showDashboard && (
        <div className="animate-slide-up">
          <SalaryDashboard provider={provider} chainId={chainId} />
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Account Info */}
        <div className={`${cardClass} animate-slide-up`} style={{ animationDelay: '0ms' }}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span className="text-2xl">👤</span> Account
          </h3>
          <div className="space-y-2">
            <InfoRow label="Chain ID" value={chainId?.toString() || "N/A"} />
            <InfoRow 
              label="Address" 
              value={accounts?.[0] ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` : "N/A"} 
            />
            <InfoRow label="Has Salary" value={salaryCompare.hasSalary ? "✓ Yes" : "✗ No"} 
                     valueClass={salaryCompare.hasSalary ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400"} />
          </div>
        </div>

        {/* FHEVM Status */}
        <div className={`${cardClass} animate-slide-up`} style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span className="text-2xl">🔐</span> FHEVM
          </h3>
          <div className="space-y-2">
            <InfoRow label="Instance" value={fhevmInstance ? "✓ Ready" : "✗ Not Ready"} 
                     valueClass={fhevmInstance ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400"} />
            <InfoRow label="Status" value={fhevmStatus} />
            <InfoRow label="Error" value={fhevmError ? fhevmError.message : "None"} />
          </div>
        </div>

        {/* Contract Info */}
        <div className={`${cardClass} animate-slide-up`} style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span className="text-2xl">📄</span> Contract
          </h3>
          <div className="space-y-2">
            <InfoRow 
              label="Address" 
              value={salaryCompare.contractAddress ? `${salaryCompare.contractAddress.slice(0, 6)}...${salaryCompare.contractAddress.slice(-4)}` : "N/A"} 
            />
            <InfoRow label="Deployed" value={salaryCompare.isDeployed ? "✓ Yes" : "✗ No"} 
                     valueClass={salaryCompare.isDeployed ? "text-green-600 dark:text-green-400 font-semibold" : "text-red-600 dark:text-red-400"} />
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Submit Salary Card */}
        <div className={`${cardClass} animate-slide-up`} style={{ animationDelay: '300ms' }}>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-3xl">💰</span> 
            {salaryCompare.hasSalary ? "Update Your Salary" : "Submit Your Salary"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Salary Amount (USD)
              </label>
              <input
                type="number"
                className={`${inputClass} ${
                  salaryInput && (parseInt(salaryInput) <= 0 || isNaN(parseInt(salaryInput)) || parseInt(salaryInput) > 10000000)
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : salaryInput && parseInt(salaryInput) > 0 && parseInt(salaryInput) <= 10000000
                    ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                    : ''
                }`}
                placeholder="e.g., 65000"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSalarySubmit();
                  }
                }}
                disabled={salaryCompare.isSubmitting}
                min="0"
                max="10000000"
                step="1000"
                aria-label="Salary amount in USD"
                aria-describedby={salaryInput && (parseInt(salaryInput) <= 0 || parseInt(salaryInput) > 10000000) ? "salary-error" : undefined}
              />
              {salaryInput && (parseInt(salaryInput) <= 0 || parseInt(salaryInput) > 10000000) && (
                <p id="salary-error" className="text-sm text-red-600 mt-1" role="alert">
                  {parseInt(salaryInput) <= 0
                    ? "Please enter a valid salary amount greater than 0"
                    : "Salary amount cannot exceed $10,000,000"
                  }
                </p>
              )}
              {salaryInput && parseInt(salaryInput) > 1000000 && parseInt(salaryInput) <= 10000000 && (
                <p className="text-sm text-amber-600 mt-1">High salary detected - ensure accuracy</p>
              )}
            </div>
            <button
              className={`${buttonClass} ${salaryCompare.isSubmitting ? 'animate-pulse opacity-75' : ''} transition-all duration-300`}
              disabled={!salaryCompare.canSubmit || !salaryInput || parseInt(salaryInput) <= 0 || parseInt(salaryInput) > 10000000}
              onClick={handleSalarySubmit}
            >
              {salaryCompare.isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {retryCount > 0 ? `Retrying... (${retryCount}/3)` : "Submitting..."}
                </div>
              ) : salaryCompare.hasSalary ? (
                "Update Salary"
              ) : (
                "Submit Salary"
              )}
            </button>
            {salaryCompare.hasSalary && (
              <div className={`mt-4 p-5 rounded-2xl border transition-all duration-500 ${
                decryptionEffect === 'high' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 animate-high-salary' 
                  : decryptionEffect === 'low'
                  ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 animate-low-salary'
                  : 'bg-indigo-50 border-indigo-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-medium ${
                    decryptionEffect === 'high' ? 'text-green-800' 
                    : decryptionEffect === 'low' ? 'text-amber-800'
                    : 'text-indigo-800'
                  }`}>
                    Your Encrypted Salary:
                  </p>
                  <button
                    onClick={salaryCompare.refreshMySalary}
                    className="text-xs px-2 py-1 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
                    title="Refresh salary data"
                  >
                    🔄 Refresh
                  </button>
                </div>
                <p className={`text-xs font-mono break-all mb-3 ${
                  decryptionEffect === 'high' ? 'text-green-600' 
                  : decryptionEffect === 'low' ? 'text-amber-600'
                  : 'text-indigo-600'
                }`}>
                  {salaryCompare.mySalary ? (
                    `${salaryCompare.mySalary.slice(0, 20)}...`
                  ) : (
                    <span className="text-amber-600">Loading salary data...</span>
                  )}
                </p>
                <button
                  className={`${buttonClass} text-sm py-2 w-full ${
                    decryptionEffect === 'high' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-celebration'
                      : decryptionEffect === 'low'
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 animate-shake'
                      : ''
                  }`}
                  disabled={!salaryCompare.canDecryptSalary || salaryCompare.isDecryptingSalary}
                  onClick={handleDecryptMySalary}
                  title={
                    !salaryCompare.canDecryptSalary 
                      ? `Cannot decrypt: ${!salaryCompare.contractAddress ? 'No contract' : !fhevmInstance ? 'FHEVM not ready' : !salaryCompare.mySalary ? 'No salary data' : salaryCompare.mySalary === '0x0000000000000000000000000000000000000000000000000000000000000000' ? 'Invalid salary' : 'Already decrypted'}`
                      : 'Click to decrypt your salary'
                  }
                >
                  {salaryCompare.isSalaryDecrypted ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">
                        {decryptionEffect === 'high' ? '🎉' : decryptionEffect === 'low' ? '💪' : ''}
                      </span>
                      <span>Decrypted: ${salaryCompare.clearMySalary?.toLocaleString()}</span>
                    </div>
                  ) : salaryCompare.isDecryptingSalary ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Decrypting...</span>
                    </div>
                  ) : (
                    "Decrypt My Salary"
                  )}
                </button>
                {!salaryCompare.canDecryptSalary && salaryCompare.hasSalary && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                    <p className="font-medium mb-1">⚠️ Cannot decrypt right now:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {!salaryCompare.contractAddress && <li>Contract address not available</li>}
                      {!fhevmInstance && <li>FHEVM instance not ready (check FHEVM status card)</li>}
                      {!ethersSigner && <li>Wallet signer not available</li>}
                      {!salaryCompare.mySalary && <li>Salary data not loaded yet</li>}
                      {salaryCompare.mySalary === '0x0000000000000000000000000000000000000000000000000000000000000000' && <li>Invalid salary data (zero hash)</li>}
                      {salaryCompare.isSalaryDecrypted && <li>Already decrypted</li>}
                      {salaryCompare.isDecryptingSalary && <li>Decryption in progress...</li>}
                    </ul>
                    <p className="mt-2 text-xs">Check the browser console (F12) for more details.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Compare Salary Card */}
        <div className={`${cardClass} animate-slide-up`} style={{ animationDelay: '400ms' }}>
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="text-3xl">🔍</span> Compare Salaries
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Address to Compare With
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="0x..."
                value={compareAddress}
                onChange={(e) => setCompareAddress(e.target.value)}
                disabled={salaryCompare.isComparing || !salaryCompare.hasSalary}
              />
            </div>
            {!salaryCompare.hasSalary && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <p className="text-sm text-yellow-800">
                  ⚠️ You must submit your salary first before comparing.
                </p>
              </div>
            )}
            <button
              className={buttonClass}
              disabled={!salaryCompare.canCompare || !compareAddress || !isValidEthereumAddress(compareAddress)}
              onClick={async () => {
                if (compareAddress && isValidEthereumAddress(compareAddress)) {
                  await salaryCompare.compareSalaries(compareAddress);
                }
              }}
            >
              {salaryCompare.isComparing
                ? "Comparing..."
                : "Compare Salaries"}
            </button>
            {salaryCompare.comparisonResult && (
              <div className={`mt-4 p-5 rounded-2xl border transition-all duration-500 ${
                decryptionEffect === 'high' && salaryCompare.isComparisonDecrypted
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 animate-high-salary' 
                  : decryptionEffect === 'low' && salaryCompare.isComparisonDecrypted
                  ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 animate-low-salary'
                  : 'bg-purple-50 border-purple-200'
              }`}>
                <p className={`text-sm mb-2 font-medium ${
                  decryptionEffect === 'high' && salaryCompare.isComparisonDecrypted ? 'text-green-800' 
                  : decryptionEffect === 'low' && salaryCompare.isComparisonDecrypted ? 'text-amber-800'
                  : 'text-purple-800'
                }`}>
                  Comparison Result (Encrypted):
                </p>
                <p className={`text-xs font-mono break-all mb-3 ${
                  decryptionEffect === 'high' && salaryCompare.isComparisonDecrypted ? 'text-green-600' 
                  : decryptionEffect === 'low' && salaryCompare.isComparisonDecrypted ? 'text-amber-600'
                  : 'text-purple-600'
                }`}>
                  Compared with: {salaryCompare.comparisonAddress.slice(0, 10)}...
                </p>
                <button
                  className={`${buttonClass} text-sm py-2 w-full ${
                    decryptionEffect === 'high' && salaryCompare.isComparisonDecrypted
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-celebration'
                      : decryptionEffect === 'low' && salaryCompare.isComparisonDecrypted
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 animate-shake'
                      : ''
                  }`}
                  disabled={!salaryCompare.canDecryptComparison}
                  onClick={handleDecryptComparison}
                >
                  {salaryCompare.isComparisonDecrypted ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">
                        {salaryCompare.clearComparisonResult 
                          ? (decryptionEffect === 'high' ? '🎉' : '📈')
                          : (decryptionEffect === 'low' ? '💪' : '📉')
                        }
                      </span>
                      <span className="font-bold">
                        {salaryCompare.clearComparisonResult 
                          ? "You earn MORE!" 
                          : "You earn LESS"}
                      </span>
                    </div>
                  ) : salaryCompare.isDecryptingComparison ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Decrypting...</span>
                    </div>
                  ) : (
                    "Decrypt Result"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Box */}
      {salaryCompare.message && (
        <div className={`${cardClass} bg-indigo-50 border-indigo-200 animate-fade-in`}>
          <p className="text-sm font-medium text-indigo-800 flex items-center gap-2">
            <span className="text-xl">💬</span>
            {salaryCompare.message}
          </p>
        </div>
      )}

      {/* How It Works */}
      <div className={`${cardClass} animate-slide-up`} style={{ animationDelay: '500ms' }}>
        <h3 className="text-xl font-bold text-gray-800 mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard 
            number="1" 
            title="Submit Salary" 
            description="Your salary is encrypted on your device before being sent to the blockchain."
            icon="🔐"
          />
          <StepCard 
            number="2" 
            title="Compare" 
            description="The smart contract compares encrypted salaries without ever decrypting them."
            icon="⚖️"
          />
          <StepCard 
            number="3" 
            title="Decrypt Result" 
            description="Only you can decrypt the comparison result to see who earns more."
            icon="✨"
          />
        </div>
      </div>
    </div>
  );
};

function InfoRow({ label, value, valueClass = "text-gray-800 dark:text-gray-200 font-mono" }: { 
  label: string; 
  value: string | number | undefined | null; 
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-1 rounded">
      <span className="text-gray-600 dark:text-gray-400">{label}:</span>
      <span className={valueClass}>{value?.toString() || "N/A"}</span>
    </div>
  );
}

function StepCard({ number, title, description, icon }: { 
  number: string; 
  title: string; 
  description: string;
  icon: string;
}) {
  return (
    <div className="text-center transition-all duration-300 hover:transform hover:scale-105">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-3xl font-bold mb-4 shadow-xl hover:shadow-2xl transition-all duration-300">
        {icon}
      </div>
      <p className="text-sm font-semibold text-indigo-600 mb-2">Step {number}</p>
      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

