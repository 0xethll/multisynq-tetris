import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseEther } from 'viem'
import {
  TETRIS_GAME_ABI,
  TETRIS_GAME_CONTRACT_ADDRESS,
  ENTRY_FEE_ETH,
} from './contract'

export function useTetrisContract(round: number) {
  const { address } = useAccount()
  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
  } = useWriteContract()

  // Check if player has paid for current round
  const { data: hasPlayerPaid, refetch: refetchHasPlayerPaid } =
    useReadContract({
      address: TETRIS_GAME_CONTRACT_ADDRESS,
      abi: TETRIS_GAME_ABI,
      functionName: 'hasPlayerPaidForRound',
      args:
        address && round !== undefined ? [address, BigInt(round)] : undefined,
    })

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    })

  const enterGame = async () => {
    if (!address) throw new Error('Wallet not connected')
    if (round === undefined) throw new Error('Round not specified')

    writeContract({
      address: TETRIS_GAME_CONTRACT_ADDRESS,
      abi: TETRIS_GAME_ABI,
      functionName: 'enterGame',
      args: [BigInt(round)],
      value: parseEther(ENTRY_FEE_ETH),
    })
  }

  return {
    // State
    hasPlayerPaid: Boolean(hasPlayerPaid),
    isWritePending,
    isConfirming,
    isConfirmed,

    // Actions
    enterGame,

    refetchHasPlayerPaid,
  }
}
