import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { TETRIS_GAME_ABI, TETRIS_GAME_CONTRACT_ADDRESS, ENTRY_FEE_ETH } from './contract'

export function useTetrisContract() {
  const { address } = useAccount()
  const { writeContract, data: hash, isPending: isWritePending } = useWriteContract()

  // Read current round
  const { data: currentRound, refetch: refetchCurrentRound } = useReadContract({
    address: TETRIS_GAME_CONTRACT_ADDRESS,
    abi: TETRIS_GAME_ABI,
    functionName: 'getCurrentRound',
  })

  // Check if player has paid for current round
  const { data: hasPlayerPaid, refetch: refetchHasPlayerPaid } = useReadContract({
    address: TETRIS_GAME_CONTRACT_ADDRESS,
    abi: TETRIS_GAME_ABI,
    functionName: 'hasPlayerPaidForRound',
    args: address && currentRound ? [address, currentRound] : undefined,
  })

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  const enterGame = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    writeContract({
      address: TETRIS_GAME_CONTRACT_ADDRESS,
      abi: TETRIS_GAME_ABI,
      functionName: 'enterGame',
      value: parseEther(ENTRY_FEE_ETH),
    })
  }

  const startNewRound = async () => {
    writeContract({
      address: TETRIS_GAME_CONTRACT_ADDRESS,
      abi: TETRIS_GAME_ABI,
      functionName: 'startNewRound',
    })
  }

  return {
    // State
    currentRound: currentRound ? Number(currentRound) : 0,
    hasPlayerPaid: Boolean(hasPlayerPaid),
    isWritePending,
    isConfirming,
    isConfirmed,
    
    // Actions
    enterGame,
    startNewRound,
    
    // Refetch functions
    refetchCurrentRound,
    refetchHasPlayerPaid,
  }
}