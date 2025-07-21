'use client'

import dynamic from 'next/dynamic'

const ReactTogetherProvider = dynamic(() => import('./ReactTogetherProvider'), {
  ssr: false,
})

interface ClientWrapperProps {
  children: React.ReactNode
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  return <ReactTogetherProvider>{children}</ReactTogetherProvider>
}