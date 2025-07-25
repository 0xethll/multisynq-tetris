export interface ActionLogEntry {
  id: number
  action: string
  userId: string
  nickname: string
  timestamp: number
}

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export interface Position {
  x: number
  y: number
}

export interface Tetromino {
  type: TetrominoType
  shape: number[][]
  position: Position
}

export interface GameState {
  round: number
  board: number[][]
  currentPiece: Tetromino | null
  nextPiece: Tetromino | null
  score: number
  level: number
  lines: number
  gameOver: boolean
  paused: boolean
}

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20

export const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
}

export function createEmptyBoard(): number[][] {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0))
}

export function getRandomTetromino(): Tetromino {
  const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
  const type = types[Math.floor(Math.random() * types.length)]

  return {
    type,
    shape: TETROMINO_SHAPES[type],
    position: {
      x:
        Math.floor(BOARD_WIDTH / 2) -
        Math.floor(TETROMINO_SHAPES[type][0].length / 2),
      y: 0,
    },
  }
}

export function rotatePiece(piece: Tetromino): Tetromino {
  const rotated = piece.shape[0].map((_, index) =>
    piece.shape.map((row) => row[index]).reverse(),
  )

  return {
    ...piece,
    shape: rotated,
  }
}

export function isValidPosition(
  board: number[][],
  piece: Tetromino,
  newPos: Position,
): boolean {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = newPos.x + x
        const boardY = newPos.y + y

        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY >= BOARD_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX])
        ) {
          return false
        }
      }
    }
  }
  return true
}

export function placePiece(board: number[][], piece: Tetromino): number[][] {
  const newBoard = board.map((row) => [...row])

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardY = piece.position.y + y
        const boardX = piece.position.x + x
        if (boardY >= 0) {
          newBoard[boardY][boardX] = 1
        }
      }
    }
  }

  return newBoard
}

export function clearLines(board: number[][]): {
  newBoard: number[][]
  linesCleared: number
} {
  const newBoard = board.filter((row) => row.some((cell) => cell === 0))
  const linesCleared = BOARD_HEIGHT - newBoard.length

  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(0))
  }

  return { newBoard, linesCleared }
}

export function calculateScore(linesCleared: number, level: number): number {
  const lineScores = [0, 40, 100, 300, 1200]
  return lineScores[linesCleared] * (level + 1)
}

export function createInitialGameState(round: number): GameState {
  return {
    round,
    board: createEmptyBoard(),
    currentPiece: getRandomTetromino(),
    nextPiece: getRandomTetromino(),
    score: 0,
    level: 0,
    lines: 0,
    gameOver: false,
    paused: false,
  }
}

export function movePiece(
  gameState: GameState,
  direction: 'left' | 'right' | 'down',
): GameState {
  if (!gameState.currentPiece || gameState.gameOver || gameState.paused) {
    return gameState
  }

  const deltaX = direction === 'left' ? -1 : direction === 'right' ? 1 : 0
  const deltaY = direction === 'down' ? 1 : 0

  const newPos = {
    x: gameState.currentPiece.position.x + deltaX,
    y: gameState.currentPiece.position.y + deltaY,
  }

  if (isValidPosition(gameState.board, gameState.currentPiece, newPos)) {
    return {
      ...gameState,
      currentPiece: {
        ...gameState.currentPiece,
        position: newPos,
      },
    }
  }

  if (direction === 'down') {
    const newBoard = placePiece(gameState.board, gameState.currentPiece)
    const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard)
    const newScore =
      gameState.score + calculateScore(linesCleared, gameState.level)
    const newLines = gameState.lines + linesCleared
    const newLevel = Math.floor(newLines / 10)

    const newPiece = gameState.nextPiece
    const gameOver = newPiece
      ? !isValidPosition(clearedBoard, newPiece, newPiece.position)
      : true

    return {
      ...gameState,
      board: clearedBoard,
      currentPiece: gameOver ? null : newPiece,
      nextPiece: gameOver ? null : getRandomTetromino(),
      score: newScore,
      level: newLevel,
      lines: newLines,
      gameOver,
    }
  }

  return gameState
}

export function rotatePieceInGame(gameState: GameState): GameState {
  if (!gameState.currentPiece || gameState.gameOver || gameState.paused) {
    return gameState
  }

  const rotatedPiece = rotatePiece(gameState.currentPiece)

  if (isValidPosition(gameState.board, rotatedPiece, rotatedPiece.position)) {
    return {
      ...gameState,
      currentPiece: rotatedPiece,
    }
  }

  return gameState
}
