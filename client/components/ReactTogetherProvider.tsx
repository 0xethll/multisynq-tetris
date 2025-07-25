'use client'

import { ReactTogether } from 'react-together'

interface ReactTogetherProviderProps {
  children: React.ReactNode
}

export default function ReactTogetherProvider({
  children,
}: ReactTogetherProviderProps) {
  return (
    <ReactTogether
      sessionParams={{
        name: 'tetris-multiplayer',
        password: 'tetris123',
        apiKey: process.env.NEXT_PUBLIC_MULTISYNQ_API_KEY || 'demo-api-key',
        appId: 'com.tetris.myapp1',
      }}
    >
      {children}
    </ReactTogether>
  )
}
