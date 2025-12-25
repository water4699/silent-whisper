"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId } from "wagmi";
import Image from "next/image";

export function Header() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const getNetworkName = (id: number) => {
    switch (id) {
      case 11155111:
        return "Sepolia";
      case 31337:
        return "Hardhat";
      default:
        return "Unknown";
    }
  };

  return (
    <nav className="flex w-full h-fit py-6 justify-between items-center">
      <div className="flex items-center gap-4">
        <Image
          src="/salary-logo.svg"
          alt="Encrypted Salary Compare Logo"
          width={50}
          height={50}
        />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Encrypted Salary Compare</h1>
          {isConnected && (
            <p className="text-sm text-gray-600">
              Connected to {getNetworkName(chainId)}
            </p>
          )}
        </div>
      </div>
      <div className="z-10">
        <ConnectButton />
      </div>
    </nav>
  );
}

