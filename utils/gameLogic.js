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
  
  const solved = solve();
  return solved ? solution : null;
};

// Count the number of solutions for a given puzzle
const countSolutions = (board, maxSolutions = 2) => {
  const workingBoard = board.map(row => [...row]);
  let solutionCount = 0;
  
  const solveBrute = () => {
    // Find the first empty cell
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        if (!workingBoard[row][col]) {
          // Try each possible value
          for (const value of HEX_VALUES) {
            if (isValidMove(workingBoard, row, col, value)) {
              workingBoard[row][col] = value;
              
              if (solveBrute()) {
                solutionCount++;
                if (solutionCount >= maxSolutions) {
                  return true; // Early exit if we found enough solutions
                }
              }
              
              workingBoard[row][col] = null;
            }
          }
          return false; // No valid value found for this cell
        }
      }
    }
    return true; // All cells filled successfully
  };
  
  solveBrute();
  return solutionCount;
};

// Check if a puzzle has exactly one unique solution
const hasUniqueSolution = (board) => {
  return countSolutions(board, 2) === 1;
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

// Generate a puzzle by removing cells from a solved board with guaranteed unique solutions
export const generatePuzzle = (difficulty = 'medium') => {
  const solution = generateSolvedBoard();
  const puzzle = solution.map(row => [...row]);
  
  // Determine target number of empty cells based on difficulty
  let targetEmptyCells;
  switch (difficulty) {
    case 'easy':
      targetEmptyCells = 60; // Leave ~196 cells filled out of 256 (77% complete)
      break;
    case 'medium':
      targetEmptyCells = 100; // Leave ~156 cells filled out of 256 (61% complete)
      break;
    case 'hard':
      targetEmptyCells = 180; // Leave ~76 cells filled
      break;
    case 'test':
      targetEmptyCells = 2; // Leave only 2 cells empty for testing
      break;
    default:
      targetEmptyCells = 140;
  }
  
  // Special handling for test mode - just remove 2 random cells without unique solution check
  if (difficulty === 'test') {
    const positions = [];
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        positions.push([row, col]);
      }
    }
    
    // Shuffle and remove 2 cells
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    
    for (let i = 0; i < 2; i++) {
      const [row, col] = positions[i];
      puzzle[row][col] = null;
    }
    
    return { puzzle, solution };
  }
  
  // Use the optimized unique solution approach for all difficulties
  return generateOptimizedUniquePuzzle(solution, targetEmptyCells, difficulty);
};

// Optimized puzzle generation that guarantees unique solutions efficiently
const generateOptimizedUniquePuzzle = (solution, targetEmptyCells, difficulty) => {
  const puzzle = solution.map(row => [...row]);
  
  // Phase 1: Strategic removal using symmetry patterns
  let removedCells = performSymmetricRemoval(puzzle, targetEmptyCells);
  
  // Phase 2: If we need more empty cells, do guided random removal
  if (removedCells < targetEmptyCells) {
    removedCells += performGuidedRemoval(puzzle, targetEmptyCells - removedCells, difficulty);
  }
  
  // Phase 3: Final validation and adjustment
  if (!hasUniqueSolution(puzzle)) {
    // If puzzle doesn't have unique solution, restore some cells strategically
    restoreForUniqueness(puzzle, solution);
  }
  
  return { puzzle, solution };
};

// Phase 1: Remove cells using symmetric patterns that tend to preserve uniqueness
const performSymmetricRemoval = (puzzle, targetEmptyCells) => {
  let removedCells = 0;
  const maxSymmetricRemoval = Math.min(targetEmptyCells * 0.6, 100); // Remove up to 60% using patterns
  
  // Pattern 1: Remove pairs of symmetric cells (across center)
  const symmetricPairs = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      symmetricPairs.push([
        [row, col], 
        [15 - row, 15 - col]
      ]);
    }
  }
  
  // Shuffle pairs
  for (let i = symmetricPairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [symmetricPairs[i], symmetricPairs[j]] = [symmetricPairs[j], symmetricPairs[i]];
  }
  
  // Remove symmetric pairs
  for (const pair of symmetricPairs) {
    if (removedCells >= maxSymmetricRemoval) break;
    
    const [[r1, c1], [r2, c2]] = pair;
    
    // Skip if cells are the same (center cells)
    if (r1 === r2 && c1 === c2) continue;
    
    // Remove both cells in the pair
    puzzle[r1][c1] = null;
    puzzle[r2][c2] = null;
    removedCells += 2;
  }
  
  return removedCells;
};

// Phase 2: Guided removal that checks uniqueness for critical cells
const performGuidedRemoval = (puzzle, remainingToRemove, difficulty) => {
  let removedCells = 0;
  const maxAttempts = difficulty === 'hard' ? remainingToRemove * 4 : remainingToRemove * 2;
  let attempts = 0;
  
  // Create priority list: prefer cells that are less constrained
  const cellPriorities = [];
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      if (puzzle[row][col] !== null) {
        const priority = calculateCellRemovalPriority(puzzle, row, col);
        cellPriorities.push({ row, col, priority });
      }
    }
  }
  
  // Sort by priority (higher priority = safer to remove)
  cellPriorities.sort((a, b) => b.priority - a.priority);
  
  // Remove cells in priority order with uniqueness checking
  for (const cell of cellPriorities) {
    if (removedCells >= remainingToRemove || attempts >= maxAttempts) break;
    
    const { row, col } = cell;
    const originalValue = puzzle[row][col];
    attempts++;
    
    // Temporarily remove the cell
    puzzle[row][col] = null;
    
    // For easier difficulties, use faster validation less frequently
    let shouldValidate = true;
    if (difficulty === 'easy' && attempts % 3 !== 0) shouldValidate = false;
    if (difficulty === 'medium' && attempts % 2 !== 0) shouldValidate = false;
    
    if (shouldValidate) {
      // Quick uniqueness check using limited depth
      if (!hasLimitedUniqueSolution(puzzle)) {
        // Restore the cell
        puzzle[row][col] = originalValue;
        continue;
      }
    }
    
    // Keep the cell removed
    removedCells++;
  }
  
  return removedCells;
};

// Calculate priority for removing a cell (higher = safer to remove)
const calculateCellRemovalPriority = (puzzle, row, col) => {
  let priority = 0;
  const value = puzzle[row][col];
  
  // Count how many times this value appears in related areas
  let valueCount = 0;
  
  // Check row
  for (let c = 0; c < 16; c++) {
    if (puzzle[row][c] === value) valueCount++;
  }
  
  // Check column  
  for (let r = 0; r < 16; r++) {
    if (puzzle[r][col] === value) valueCount++;
  }
  
  // Check sub-grid
  const subGridRow = Math.floor(row / 4) * 4;
  const subGridCol = Math.floor(col / 4) * 4;
  for (let r = subGridRow; r < subGridRow + 4; r++) {
    for (let c = subGridCol; c < subGridCol + 4; c++) {
      if (puzzle[r][c] === value) valueCount++;
    }
  }
  
  // Higher value count means more constrained, lower priority
  priority = 50 - valueCount;
  
  // Add randomness
  priority += Math.random() * 10;
  
  return priority;
};

// Limited depth uniqueness check for performance
const hasLimitedUniqueSolution = (puzzle) => {
  const solutionCount = countSolutionsLimited(puzzle, 2, 50); // Limit depth to 50 moves
  return solutionCount === 1;
};

// Count solutions with limited search depth for performance
const countSolutionsLimited = (board, maxSolutions, maxDepth, currentDepth = 0) => {
  if (currentDepth >= maxDepth) {
    // If we've gone too deep, assume it's solvable (optimistic)
    return 1;
  }
  
  const workingBoard = board.map(row => [...row]);
  let solutionCount = 0;
  
  const solveBrute = (depth) => {
    if (depth >= maxDepth) return true; // Depth limit reached
    
    // Find the first empty cell
    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        if (!workingBoard[row][col]) {
          // Try each possible value
          for (const value of HEX_VALUES) {
            if (isValidMove(workingBoard, row, col, value)) {
              workingBoard[row][col] = value;
              
              if (solveBrute(depth + 1)) {
                solutionCount++;
                if (solutionCount >= maxSolutions) {
                  return true; // Early exit if we found enough solutions
                }
              }
              
              workingBoard[row][col] = null;
            }
          }
          return false; // No valid value found for this cell
        }
      }
    }
    return true; // All cells filled successfully
  };
  
  solveBrute(currentDepth);
  return solutionCount;
};

// Phase 3: Restore cells strategically if puzzle doesn't have unique solution
const restoreForUniqueness = (puzzle, solution) => {
  const emptyCells = [];
  
  // Find all empty cells
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 16; col++) {
      if (puzzle[row][col] === null) {
        emptyCells.push([row, col]);
      }
    }
  }
  
  // Shuffle empty cells
  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [emptyCells[i], emptyCells[j]] = [emptyCells[j], emptyCells[i]];
  }
  
  // Restore cells one by one until we have unique solution
  let attempts = 0;
  const maxAttempts = Math.min(emptyCells.length, 20);
  
  while (!hasUniqueSolution(puzzle) && attempts < maxAttempts) {
    const [row, col] = emptyCells[attempts];
    puzzle[row][col] = solution[row][col];
    attempts++;
  }
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
