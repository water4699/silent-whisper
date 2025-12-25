"use client";

import { useFhevm } from "../fhevm/useFhevm";
import { useInMemoryStorage } from "../hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "../hooks/metamask/useMetaMaskEthersSigner";
import { useSalaryCompare } from "@/hooks/useSalaryCompare";
import { errorNotDeployed } from "./ErrorNotDeployed";
import { useState } from "react";
import { useAccount } from "wagmi";

export const SalaryCompareDemo = () => {
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

  const buttonClass =
    "inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg " +
    "transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl transform hover:-translate-y-0.5 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:transform-none";

  const inputClass =
    "w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 " +
    "transition-all duration-200 outline-none text-gray-800 placeholder-gray-400";

  const cardClass = "bg-white rounded-xl shadow-lg p-6 border-2 border-gray-100";

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            Welcome to Encrypted Salary Compare
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compare salaries privately without revealing actual numbers using Fully Homomorphic Encryption (FHE).
            Connect your wallet to get started.
          </p>
        </div>
        <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border-2 border-gray-100">
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">🔒</div>
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
      {/* Header */}
      <div className={`${cardClass} bg-gradient-to-r from-blue-600 to-indigo-600 text-white`}>
        <h2 className="text-3xl font-bold mb-2">Encrypted Salary Compare</h2>
        <p className="text-blue-100">
          Compare salaries privately using Fully Homomorphic Encryption
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Account Info */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">👤</span> Account
          </h3>
          <div className="space-y-2">
            <InfoRow label="Chain ID" value={chainId?.toString() || "N/A"} />
            <InfoRow 
              label="Address" 
              value={accounts?.[0] ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` : "N/A"} 
            />
            <InfoRow label="Has Salary" value={salaryCompare.hasSalary ? "✓ Yes" : "✗ No"} 
                     valueClass={salaryCompare.hasSalary ? "text-green-600 font-semibold" : "text-red-600"} />
          </div>
        </div>

        {/* FHEVM Status */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">🔐</span> FHEVM
          </h3>
          <div className="space-y-2">
            <InfoRow label="Instance" value={fhevmInstance ? "✓ Ready" : "✗ Not Ready"} 
                     valueClass={fhevmInstance ? "text-green-600 font-semibold" : "text-red-600"} />
            <InfoRow label="Status" value={fhevmStatus} />
            <InfoRow label="Error" value={fhevmError ? fhevmError.message : "None"} />
          </div>
        </div>

        {/* Contract Info */}
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-2xl">📄</span> Contract
          </h3>
          <div className="space-y-2">
            <InfoRow 
              label="Address" 
              value={salaryCompare.contractAddress ? `${salaryCompare.contractAddress.slice(0, 6)}...${salaryCompare.contractAddress.slice(-4)}` : "N/A"} 
            />
            <InfoRow label="Deployed" value={salaryCompare.isDeployed ? "✓ Yes" : "✗ No"} 
                     valueClass={salaryCompare.isDeployed ? "text-green-600 font-semibold" : "text-red-600"} />
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit Salary Card */}
        <div className={cardClass}>
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
                className={inputClass}
                placeholder="e.g., 65000"
                value={salaryInput}
                onChange={(e) => setSalaryInput(e.target.value)}
                disabled={salaryCompare.isSubmitting}
                min="0"
                step="1000"
              />
            </div>
            <button
              className={buttonClass}
              disabled={!salaryCompare.canSubmit || !salaryInput || parseInt(salaryInput) <= 0}
              onClick={async () => {
                const salary = parseInt(salaryInput);
                if (salary > 0) {
                  await salaryCompare.submitSalary(salary);
                  setSalaryInput("");
                }
              }}
            >
              {salaryCompare.isSubmitting
                ? "Submitting..."
                : salaryCompare.hasSalary
                ? "Update Salary"
                : "Submit Salary"}
            </button>
            {salaryCompare.hasSalary && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2 font-medium">
                  Your Encrypted Salary:
                </p>
                <p className="text-xs font-mono text-blue-600 break-all mb-3">
                  {salaryCompare.mySalary?.slice(0, 20)}...
                </p>
                <button
                  className={`${buttonClass} text-sm py-2`}
                  disabled={!salaryCompare.canDecryptSalary}
                  onClick={salaryCompare.decryptMySalary}
                >
                  {salaryCompare.isSalaryDecrypted
                    ? `Decrypted: $${salaryCompare.clearMySalary?.toString()}`
                    : salaryCompare.isDecryptingSalary
                    ? "Decrypting..."
                    : "Decrypt My Salary"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Compare Salary Card */}
        <div className={cardClass}>
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
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ You must submit your salary first before comparing.
                </p>
              </div>
            )}
            <button
              className={buttonClass}
              disabled={!salaryCompare.canCompare || !compareAddress}
              onClick={async () => {
                if (compareAddress) {
                  await salaryCompare.compareSalaries(compareAddress);
                }
              }}
            >
              {salaryCompare.isComparing
                ? "Comparing..."
                : "Compare Salaries"}
            </button>
            {salaryCompare.comparisonResult && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800 mb-2 font-medium">
                  Comparison Result (Encrypted):
                </p>
                <p className="text-xs font-mono text-green-600 break-all mb-3">
                  Compared with: {salaryCompare.comparisonAddress.slice(0, 10)}...
                </p>
                <button
                  className={`${buttonClass} text-sm py-2`}
                  disabled={!salaryCompare.canDecryptComparison}
                  onClick={salaryCompare.decryptComparisonResult}
                >
                  {salaryCompare.isComparisonDecrypted
                    ? salaryCompare.clearComparisonResult
                      ? "You earn MORE! 📈"
                      : "You earn LESS 📉"
                    : salaryCompare.isDecryptingComparison
                    ? "Decrypting..."
                    : "Decrypt Result"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Box */}
      {salaryCompare.message && (
        <div className={`${cardClass} bg-blue-50 border-blue-200`}>
          <p className="text-sm font-medium text-blue-800 flex items-center gap-2">
            <span className="text-xl">💬</span>
            {salaryCompare.message}
          </p>
        </div>
      )}

      {/* How It Works */}
      <div className={cardClass}>
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

function InfoRow({ label, value, valueClass = "text-gray-800 font-mono" }: { 
  label: string; 
  value: string | number | undefined | null; 
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600">{label}:</span>
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
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-2xl font-bold mb-3 shadow-lg">
        {icon}
      </div>
      <p className="text-sm font-semibold text-blue-600 mb-1">Step {number}</p>
      <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

