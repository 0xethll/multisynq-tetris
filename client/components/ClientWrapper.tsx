'use client'

import dynamic from 'next/dynamic'

const ReactTogetherProvider = dynamic(() => import('./ReactTogetherProvider'), {
  ssr: false,
})

const Web3Provider = dynamic(() => import('./Web3Provider'), {
  ssr: false,
})

interface ClientWrapperProps {
  children: React.ReactNode
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return (
    <Web3Provider>
      <ReactTogetherProvider>{children}</ReactTogetherProvider>
    </Web3Provider>
  )
}