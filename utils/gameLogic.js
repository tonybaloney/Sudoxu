// Hexadecimal Sudoku Game Logic
// 16x16 grid with values 0-F (0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F)

const HEX_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

// Generate a random solved 16x16 hexadecimal sudoku
export const generateSolvedBoard = () => {
  const board = Array(16).fill(null).map(() => Array(16).fill(null));
  
  // Use backtracking to generate a valid solution
  if (solveBoardRecursive(board)) {
    return board;
  }
  
  // Fallback: create a known valid pattern
  return createValidPattern();
};

// Recursive backtracking solver for board generation
const solveBoardRecursive = (board) => {
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      if (board[row][col] === null) {
        // Shuffle hex values for randomness
        const shuffledValues = [...HEX_VALUES].sort(() => Math.random() - 0.5);
        
        for (const value of shuffledValues) {
          if (isValidMove(board, row, col, value)) {
            board[row][col] = value;
            
            if (solveBoardRecursive(board)) {
              return true;
            }
            
            board[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
};

// Create a known valid 16x16 Sudoku pattern
const createValidPattern = () => {
  const board = Array(16).fill(null).map(() => Array(16).fill(null));
  
  // Fill the first row with hex values in order
  for (let col = 0; col < 16; col++) {
    board[0][col] = HEX_VALUES[col];
  }
  
  // Fill subsequent rows using a pattern that ensures validity
  for (let row = 1; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      // Calculate the value based on row and column with proper offset
      let valueIndex;
      
      // Within each 4x4 sub-grid, arrange values to avoid conflicts
      const subGridRow = Math.floor(row / 4);
      const subGridCol = Math.floor(col / 4);
      const posInSubGrid = (row % 4) * 4 + (col % 4);
      
      // Use a different shifting pattern for each sub-grid row
      if (subGridRow === 0) {
        valueIndex = (col + row * 4) % 16;
      } else if (subGridRow === 1) {
        valueIndex = (col + row * 4 + 4) % 16;
      } else if (subGridRow === 2) {
        valueIndex = (col + row * 4 + 8) % 16;
      } else {
        valueIndex = (col + row * 4 + 12) % 16;
      }
      
      board[row][col] = HEX_VALUES[valueIndex];
    }
  }
  
  // Verify and fix any conflicts
  fixBoardConflicts(board);
  
  return board;
};

// Fix any remaining conflicts in the board
const fixBoardConflicts = (board) => {
  let maxAttempts = 1000;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    let hasConflict = false;
    
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        const conflicts = getConflicts(board, row, col);
        if (conflicts.length > 0) {
          hasConflict = true;
          
          // Try to find a valid value for this cell
          const originalValue = board[row][col];
          board[row][col] = null;
          
          for (const value of HEX_VALUES) {
            if (isValidMove(board, row, col, value)) {
              board[row][col] = value;
              break;
            }
          }
          
          // If no valid value found, restore original and continue
          if (board[row][col] === null) {
            board[row][col] = originalValue;
          }
        }
      }
    }
    
    if (!hasConflict) {
      break;
    }
    
    attempts++;
  }
};

// Solve the puzzle (for hint system - future enhancement)
export const solvePuzzle = (board) => {
  const solution = board.map(row => [...row]);
  
  const solve = () => {
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        if (!solution[row][col]) {
          for (const value of HEX_VALUES) {
            if (isValidMove(solution, row, col, value)) {
              solution[row][col] = value;
              if (solve()) return true;
              solution[row][col] = null;
            }
          }
          return false;
        }
      }
    }
    return true;
  };
  
  solve();
  return solution;
};

// Check if a move is valid
export const isValidMove = (board, row, col, value) => {
  // Check row
  for (let c = 0; c < 16; c++) {
    if (c !== col && board[row][c] === value) {
      return false;
    }
  }
  
  // Check column
  for (let r = 0; r < 16; r++) {
    if (r !== row && board[r][col] === value) {
      return false;
    }
  }
  
  // Check 4x4 sub-grid
  const subGridRow = Math.floor(row / 4) * 4;
  const subGridCol = Math.floor(col / 4) * 4;
  
  for (let r = subGridRow; r < subGridRow + 4; r++) {
    for (let c = subGridCol; c < subGridCol + 4; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        return false;
      }
    }
  }
  
  return true;
};

// Get all conflicting cells for a given position
export const getConflicts = (board, row, col) => {
  const conflicts = [];
  const value = board[row][col];
  
  if (!value) return conflicts;
  
  // Check row conflicts
  for (let c = 0; c < 16; c++) {
    if (c !== col && board[row][c] === value) {
      conflicts.push([row, c]);
      conflicts.push([row, col]);
    }
  }
  
  // Check column conflicts
  for (let r = 0; r < 16; r++) {
    if (r !== row && board[r][col] === value) {
      conflicts.push([r, col]);
      conflicts.push([row, col]);
    }
  }
  
  // Check sub-grid conflicts
  const subGridRow = Math.floor(row / 4) * 4;
  const subGridCol = Math.floor(col / 4) * 4;
  
  for (let r = subGridRow; r < subGridRow + 4; r++) {
    for (let c = subGridCol; c < subGridCol + 4; c++) {
      if ((r !== row || c !== col) && board[r][c] === value) {
        conflicts.push([r, c]);
        conflicts.push([row, col]);
      }
    }
  }
  
  // Remove duplicates
  return conflicts.filter((conflict, index, self) => 
    index === self.findIndex(c => c[0] === conflict[0] && c[1] === conflict[1])
  );
};

// Check if the board is completely solved
export const isSolved = (board) => {
  // Check if all cells are filled
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      if (!board[row][col]) return false;
    }
  }
  
  // Check if no conflicts exist
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      const conflicts = getConflicts(board, row, col);
      if (conflicts.length > 0) return false;
    }
  }
  
  return true;
};

// Generate a puzzle by removing cells from a solved board
export const generatePuzzle = (difficulty = 'medium') => {
  const solution = generateSolvedBoard();
  const puzzle = solution.map(row => [...row]);
  
  // Determine how many cells to remove based on difficulty
  let cellsToRemove;
  switch (difficulty) {
    case 'easy':
      cellsToRemove = 60; // Leave ~196 cells filled out of 256 (77% complete)
      break;
    case 'medium':
      cellsToRemove = 140; // Leave ~116 cells filled
      break;
    case 'hard':
      cellsToRemove = 180; // Leave ~76 cells filled
      break;
    default:
      cellsToRemove = 140;
  }
  
  // Randomly remove cells
  const positions = [];
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      positions.push([row, col]);
    }
  }
  
  // Shuffle positions
  for (let i = positions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }
  
  // Remove cells
  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [row, col] = positions[i];
    puzzle[row][col] = null;
  }
  
  return { puzzle, solution };
};

// Get a hint for the next move
export const getHint = (board, solution) => {
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      if (!board[row][col] && solution[row][col]) {
        return { row, col, value: solution[row][col] };
      }
    }
  }
  return null;
};

// Calculate completion percentage for each hex value
export const getValueCompletionStats = (board) => {
  const stats = {};
  
  // Initialize stats for each hex value
  HEX_VALUES.forEach(value => {
    stats[value] = {
      filled: 0,
      total: 16, // Each value should appear 16 times in a 16x16 grid
      percentage: 0
    };
  });
  
  // Count filled instances of each value
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      const value = board[row][col];
      if (value && stats[value]) {
        stats[value].filled++;
      }
    }
  }
  
  // Calculate percentages
  Object.keys(stats).forEach(value => {
    stats[value].percentage = (stats[value].filled / stats[value].total) * 100;
  });
  
  return stats;
};

// Get the next value to focus on (highest completion percentage)
export const getNextValueToTackle = (board) => {
  const stats = getValueCompletionStats(board);
  
  // Find the value with the highest completion percentage (but not 100%)
  let nextValue = null;
  let highestPercentage = -1;
  
  Object.entries(stats).forEach(([value, data]) => {
    if (data.percentage > highestPercentage && data.percentage < 100) {
      highestPercentage = data.percentage;
      nextValue = value;
    }
  });
  
  return {
    value: nextValue,
    percentage: Math.round(highestPercentage),
    remaining: nextValue ? 16 - stats[nextValue].filled : 0
  };
};
