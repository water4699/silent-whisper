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
    <nav className="flex w-full h-fit py-6 justify-between items-center animate-slide-down">
      <div className="flex items-center gap-4">
        <div className="animate-scale-in">
          <Image
            src="/salary-logo.svg"
            alt="Encrypted Salary Compare Logo"
            width={50}
            height={50}
            className="transition-transform duration-300 hover:scale-110"
          />
        </div>
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Encrypted Salary Compare
          </h1>
          {isConnected && (
            <p className="text-sm text-gray-600 animate-fade-in">
              Connected to {getNetworkName(chainId)}
            </p>
          )}
        </div>
      </div>
      <div className="z-10 animate-fade-in">
        <ConnectButton />
      </div>
    </nav>
  );
}

