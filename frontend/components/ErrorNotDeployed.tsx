export function errorNotDeployed(chainId: number | undefined) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="max-w-2xl p-8 bg-red-50 rounded-xl shadow-lg border-2 border-red-200">
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-800">Contract Not Deployed</h2>
          <p className="text-red-700">
            The SalaryCompare contract is not deployed on chain ID: <strong>{chainId}</strong>
          </p>
          <div className="mt-6 p-4 bg-white rounded-lg border border-red-300">
            <p className="text-sm text-gray-700 mb-2 font-semibold">To deploy the contract:</p>
            <ol className="text-left text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>Navigate to the project root directory</li>
              <li>Run: <code className="bg-gray-100 px-2 py-1 rounded font-mono">npx hardhat deploy --network [network-name]</code></li>
              <li>Refresh this page after deployment</li>
            </ol>
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Supported networks: localhost (31337), sepolia (11155111)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

