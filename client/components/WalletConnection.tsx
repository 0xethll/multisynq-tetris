'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { ConnectKitButton } from 'connectkit'

export default function WalletConnection() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  return (
    <div className="border-2 border-black bg-white p-4">
      <h2 className="text-lg font-bold mb-2 text-black">WALLET</h2>
      
      {isConnected ? (
        <div className="space-y-2">
          <div className="text-sm text-black font-medium">
            <div className="text-xs text-gray-600 mb-1">Connected:</div>
            <div className="font-mono text-xs break-all">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
          </div>
          <button
            onClick={() => disconnect()}
            className="w-full px-3 py-2 text-xs bg-red-600 text-white border-2 border-red-600 hover:bg-white hover:text-red-600 transition-colors font-medium"
          >
            DISCONNECT
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-sm text-gray-600 mb-2">
            Connect wallet to enable blockchain features
          </div>
          <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress, ensName }) => {
              return (
                <button
                  onClick={show}
                  className="w-full px-3 py-2 text-xs bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors font-medium"
                >
                  CONNECT WALLET
                </button>
              )
            }}
          </ConnectKitButton.Custom>
        </div>
      )}
    </div>
  )
}