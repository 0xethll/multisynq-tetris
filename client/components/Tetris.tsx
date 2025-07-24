'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useStateTogether, useConnectedUsers } from 'react-together'
import { useAccount } from 'wagmi'
import { ConnectKitButton } from 'connectkit'
import {
  GameState,
  createInitialGameState,
  movePiece,
  rotatePieceInGame,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  ActionLogEntry,
} from '../lib/tetris'
import { useTetrisContract } from '../lib/useTetrisContract'
import { ENTRY_FEE_ETH } from '../lib/contract'
import WalletConnection from './WalletConnection'

export default function Tetris() {
  const { isConnected } = useAccount()
  const {
    currentRound,
    hasPlayerPaid,
    isWritePending,
    isConfirming,
    isConfirmed,
    enterGame,
    refetchHasPlayerPaid,
  } = useTetrisContract()
  const [gameState, setGameState] = useStateTogether<GameState>(
    'tetris-game',
    createInitialGameState(),
  )
  const [actionLog, setActionLog] = useStateTogether<ActionLogEntry[]>(
    'action-log',
    [],
  )
  const [lastUpdate, setLastUpdate] = useState(Date.now())
  const [fadingActions, setFadingActions] = useState<Set<number>>(new Set())
  const timeoutRefs = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const connectedUsers = useConnectedUsers()

  console.log(connectedUsers)
  console.log(
    'Am I connected:',
    connectedUsers.find((u) => u.isYou),
  )

  // Leader election: deterministic failover based on sorted user IDs
  const getLeader = () => {
    if (connectedUsers.length === 0) return null
    return connectedUsers
      .slice() // Create copy to avoid mutating original
      .sort((a, b) => a.userId.localeCompare(b.userId))[0]
  }

  const currentLeader = getLeader()
  const myUser = connectedUsers.find((u) => u.isYou)
  const isLeader =
    currentLeader && myUser && currentLeader.userId === myUser.userId
  const hasPlayers = connectedUsers.length > 0

  // Helper function to add action to log
  const addAction = useCallback(
    (action: string) => {
      if (!myUser) return

      const newAction: ActionLogEntry = {
        id: Date.now(),
        action,
        userId: myUser.userId.slice(0, 8),
        nickname: myUser.nickname,
        timestamp: Date.now(),
      }

      // Keep only last 10 actions
      setActionLog([newAction, ...actionLog.slice(0, 9)])

      // Auto-fade out after 4 seconds
      const timeoutId = setTimeout(() => {
        setFadingActions((prev) => new Set([...prev, newAction.id]))

        // Remove from DOM after fade animation completes
        setTimeout(() => {
          setFadingActions((prev) => {
            const next = new Set(prev)
            next.delete(newAction.id)
            return next
          })
        }, 500) // Match CSS animation duration
      }, 4000)

      timeoutRefs.current.set(newAction.id, timeoutId)
    },
    [myUser, actionLog, setActionLog],
  )

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((timeout) => clearTimeout(timeout))
    }
  }, [])

  // Refetch payment status when transaction is confirmed
  useEffect(() => {
    if (isConfirmed) {
      refetchHasPlayerPaid()
    }
  }, [isConfirmed, refetchHasPlayerPaid])

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (gameState.gameOver || !isConnected || !hasPlayerPaid) return

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          addAction('⬅️ moved left')
          setGameState(movePiece(gameState, 'left'))
          break
        case 'ArrowRight':
          event.preventDefault()
          addAction('➡️ moved right')
          setGameState(movePiece(gameState, 'right'))
          break
        case 'ArrowDown':
          event.preventDefault()
          addAction('⬇️ soft dropped')
          setGameState(movePiece(gameState, 'down'))
          break
        case 'ArrowUp':
        case ' ':
          event.preventDefault()
          addAction('🔄 rotated piece')
          setGameState(rotatePieceInGame(gameState))
          break
        case 'p':
        case 'P':
          event.preventDefault()
          addAction(gameState.paused ? '▶️ resumed game' : '⏸️ paused game')
          setGameState({
            ...gameState,
            paused: !gameState.paused,
          })
          break
      }
    },
    [gameState, addAction, isConnected, hasPlayerPaid],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // Game loop - only leader controls automatic piece dropping
  useEffect(() => {
    if (
      !isLeader ||
      !hasPlayers ||
      gameState.gameOver ||
      gameState.paused ||
      !isConnected ||
      !hasPlayerPaid
    )
      return

    const dropSpeed = Math.max(50, 800 - gameState.level * 50)

    const gameLoop = setInterval(() => {
      const now = Date.now()
      if (now - lastUpdate > dropSpeed) {
        setGameState(movePiece(gameState, 'down'))
        setLastUpdate(now)
      }
    }, 16)

    return () => clearInterval(gameLoop)
  }, [
    isLeader,
    hasPlayers,
    gameState.level,
    gameState.gameOver,
    gameState.paused,
    lastUpdate,
    gameState,
    isConnected,
    hasPlayerPaid,
  ])

  const resetGame = () => {
    if (!isConnected || !hasPlayerPaid) return
    setGameState(createInitialGameState())
    setLastUpdate(Date.now())
  }

  const renderBoard = () => {
    const displayBoard = gameState.board.map((row) => [...row])

    if (gameState.currentPiece) {
      const piece = gameState.currentPiece
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const boardY = piece.position.y + y
            const boardX = piece.position.x + x
            if (
              boardY >= 0 &&
              boardY < BOARD_HEIGHT &&
              boardX >= 0 &&
              boardX < BOARD_WIDTH
            ) {
              displayBoard[boardY][boardX] = 1
            }
          }
        }
      }
    }

    return displayBoard.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`w-6 h-6 border border-gray-400 ${
              cell ? 'bg-black' : 'bg-white'
            }`}
          />
        ))}
      </div>
    ))
  }

  const renderNextPiece = () => {
    if (!gameState.nextPiece) return null

    const piece = gameState.nextPiece
    const maxSize = 4
    const grid = Array(maxSize)
      .fill(null)
      .map(() => Array(maxSize).fill(0))

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          grid[y][x] = 1
        }
      }
    }

    return grid.map((row, y) => (
      <div key={y} className="flex">
        {row.map((cell, x) => (
          <div
            key={`${y}-${x}`}
            className={`w-4 h-4 border border-gray-300 ${
              cell ? 'bg-black' : 'bg-white'
            }`}
          />
        ))}
      </div>
    ))
  }

  const renderCornerOverlay = () => {
    // Show only last 3 actions that haven't fully faded out
    const visibleActions = actionLog.slice(0, 3).filter((entry) => {
      const isFading = fadingActions.has(entry.id)
      const age = Date.now() - entry.timestamp
      return age < 4500 // Show for 4.5 seconds total
    })

    if (visibleActions.length === 0) return null

    return (
      <div className="absolute top-1 left-1 z-10 space-y-0.5 pointer-events-none">
        {visibleActions.map((entry) => {
          const isFading = fadingActions.has(entry.id)
          return (
            <div
              key={entry.id}
              className={`
                text-xs px-2 py-1 rounded-sm
                max-w-52 truncate leading-tight
                ${isFading ? 'action-fade-out' : 'action-fade-in'}
              `}
            >
              <span className="text-yellow-500">{entry.nickname}:</span>{' '}
              <span className="text-blue-500">
                {entry.action.replace(/[⬅️➡️⬇️🔄⏸️▶️]/g, '').trim()}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 relative">
      {!isConnected && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button
                onClick={show}
                className="px-6 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors font-bold text-lg"
              >
                CONNECT WALLET
              </button>
            )}
          </ConnectKitButton.Custom>
        </div>
      )}

      {isConnected && !hasPlayerPaid && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-8 border-4 border-black text-center">
            <h2 className="text-2xl font-bold mb-4 text-black">ROUND {currentRound}</h2>
            <p className="text-lg mb-6 text-black">
              Pay <span className="font-bold">{ENTRY_FEE_ETH} ETH</span> to enter the game
            </p>
            <button
              onClick={enterGame}
              disabled={isWritePending || isConfirming}
              className={`px-6 py-3 border-2 transition-colors font-bold text-lg ${
                isWritePending || isConfirming
                  ? 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed'
                  : 'bg-black text-white border-black hover:bg-white hover:text-black cursor-pointer'
              }`}
            >
              {isWritePending && 'CONFIRM IN WALLET...'}
              {isConfirming && 'PROCESSING PAYMENT...'}
              {!isWritePending && !isConfirming && `PAY ${ENTRY_FEE_ETH} ETH`}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-8 items-start">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold mb-4 text-black">TETRIS</h1>

          <div className="border-4 border-black bg-white p-2 relative">
            {renderBoard()}
            {renderCornerOverlay()}
            {!hasPlayers && (
              <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-xl font-bold mb-2">NO PLAYERS</p>
                  <p className="text-sm">Game paused until someone joins</p>
                </div>
              </div>
            )}
          </div>

          {gameState.gameOver && (
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-red-600 mb-2">GAME OVER</p>
              <button
                onClick={resetGame}
                disabled={!isConnected}
                className={`px-4 py-2 border-2 transition-colors ${
                  isConnected
                    ? 'bg-black text-white border-black hover:bg-white hover:text-black cursor-pointer'
                    : 'bg-gray-400 text-gray-600 border-gray-400 cursor-not-allowed'
                }`}
              >
                NEW GAME
              </button>
            </div>
          )}

          {gameState.paused && !gameState.gameOver && (
            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-blue-600">PAUSED</p>
              <p className="text-sm text-gray-600">Press P to resume</p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <WalletConnection />

          <div className="border-2 border-black bg-white p-4">
            <h2 className="text-lg font-bold mb-2 text-black">GAME INFO</h2>
            <div className="space-y-1 text-sm text-black font-medium">
              <div>Round: {currentRound}</div>
              <div>Connected: {connectedUsers.length}</div>
              <div className={`text-xs font-medium ${hasPlayerPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                Status: {hasPlayerPaid ? 'PAID ✓' : 'PAYMENT REQUIRED'}
              </div>
              {hasPlayers ? (
                <>
                  <div className="text-xs text-gray-700 font-medium">
                    Leader: {currentLeader?.userId.slice(0, 8)}...
                  </div>
                  {isLeader && (
                    <div className="text-xs font-bold text-green-600">
                      YOU ARE LEADER
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-red-600 font-medium">
                  Waiting for players...
                </div>
              )}
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4">
            <h2 className="text-lg font-bold mb-2 text-black">NEXT</h2>
            <div className="flex flex-col">{renderNextPiece()}</div>
          </div>

          <div className="border-2 border-black bg-white p-4">
            <h2 className="text-lg font-bold mb-2 text-black">STATS</h2>
            <div className="space-y-1 text-sm text-black font-medium">
              <div>Score: {gameState.score.toLocaleString()}</div>
              <div>Level: {gameState.level}</div>
              <div>Lines: {gameState.lines}</div>
            </div>
          </div>

          <div className="border-2 border-black bg-white p-4">
            <h2 className="text-lg font-bold mb-2 text-black">CONTROLS</h2>
            <div className="space-y-1 text-xs text-black font-medium">
              <div>← → Move</div>
              <div>↓ Soft Drop</div>
              <div>↑ / SPACE Rotate</div>
              <div>P Pause</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
