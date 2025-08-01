import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Vibration,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  Animated,
  Platform,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Game utilities
import { generatePuzzle, isValidMove, isSolved, getConflicts, getNextValueToTackle } from './utils/gameLogic';

const HEX_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];

// Color palette for hex values - using accessible, high-contrast colors
const HEX_COLORS = {
  '0': '#FF4444', // Bright Red
  '1': '#228B22', // Forest Green (darker than bright green)
  '2': '#4444FF', // Bright Blue
  '3': '#FF8C00', // Dark Orange (darker than yellow)
  '4': '#FF44FF', // Magenta
  '5': '#008B8B', // Dark Cyan (much darker than cyan)
  '6': '#B8860B', // Dark Goldenrod (darker than yellow)
  '7': '#AA44FF', // Purple
  '8': '#8B4513', // Saddle Brown - changed from tomato red
  '9': '#32CD32', // Lime Green (medium brightness)
  'A': '#8844FF', // Blue Purple
  'B': '#FF1493', // Deep Pink - kept as is
  'C': '#4169E1', // Royal Blue
  'D': '#9ACD32', // Yellow Green (darker than lime)
  'E': '#DC143C', // Crimson
  'F': '#2F4F4F', // Dark Slate Gray
};

export default function App() {
  const [board, setBoard] = useState(null);
  const [initialBoard, setInitialBoard] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [difficulty, setDifficulty] = useState('medium');
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'won'
  const [conflicts, setConflicts] = useState([]);
  const [nextValueHint, setNextValueHint] = useState(null);

  // Combo system state
  const [comboTimer, setComboTimer] = useState(0); // Time remaining for combo (in milliseconds)
  const [comboMultiplier, setComboMultiplier] = useState(0); // Current combo multiplier
  const [totalScore, setTotalScore] = useState(0); // Total accumulated score
  const [comboScore, setComboScore] = useState(0); // Score from current combo
  const [comboBarWidth] = useState(new Animated.Value(0)); // Animated width for combo bar
  
  // Win modal state
  const [showWinModal, setShowWinModal] = useState(false);
  const [winData, setWinData] = useState({ time: '', score: 0 });

  const COMBO_DURATION = 30000; // 30 seconds in milliseconds
  const BASE_SCORE = 100; // Base score for each correct move

  // Safe haptics functions that work on all platforms
  const safeHapticSelection = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (error) {
        // Fallback for unsupported platforms
      }
    }
  };

  const safeHapticSuccess = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        // Fallback for unsupported platforms
      }
    }
  };

  const safeHapticError = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch (error) {
        // Fallback for unsupported platforms
      }
    }
  };

  const safeHapticImpact = (style) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (error) {
        // Fallback for unsupported platforms
      }
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameState === 'playing' && gameStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - gameStartTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, gameStartTime]);

  // Keyboard input effect (for desktop)
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (gameState !== 'playing' || !selectedCell) return;
      
      const key = event.key.toUpperCase();
      
      // Handle hex values (0-9, A-F)
      if (HEX_VALUES.includes(key)) {
        event.preventDefault();
        inputValue(key);
      }
      // Handle backspace/delete to clear cell
      else if (key === 'BACKSPACE' || key === 'DELETE') {
        event.preventDefault();
        clearCell();
      }
      // Handle arrow keys for navigation
      else if (['ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'].includes(key)) {
        event.preventDefault();
        navigateWithArrowKeys(key);
      }
    };

    // Only add keyboard listeners on web platform
    if (Platform.OS === 'web') {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [gameState, selectedCell, board, initialBoard]);

  // Navigate with arrow keys
  const navigateWithArrowKeys = (key) => {
    if (!selectedCell || !board) return;
    
    const [row, col] = selectedCell;
    let newRow = row;
    let newCol = col;
    
    switch (key) {
      case 'ARROWUP':
        newRow = Math.max(0, row - 1);
        break;
      case 'ARROWDOWN':
        newRow = Math.min(15, row + 1);
        break;
      case 'ARROWLEFT':
        newCol = Math.max(0, col - 1);
        break;
      case 'ARROWRIGHT':
        newCol = Math.min(15, col + 1);
        break;
    }
    
    // Only move if the target cell is not pre-filled
    if (initialBoard && initialBoard[newRow][newCol] === null) {
      setSelectedCell([newRow, newCol]);
    } else {
      // If target cell is pre-filled, try to find the next available cell in that direction
      let searchRow = newRow;
      let searchCol = newCol;
      
      for (let i = 0; i < 16; i++) {
        if (initialBoard && initialBoard[searchRow][searchCol] === null) {
          setSelectedCell([searchRow, searchCol]);
          break;
        }
        
        // Continue searching in the same direction
        switch (key) {
          case 'ARROWUP':
            searchRow = Math.max(0, searchRow - 1);
            break;
          case 'ARROWDOWN':
            searchRow = Math.min(15, searchRow + 1);
            break;
          case 'ARROWLEFT':
            searchCol = Math.max(0, searchCol - 1);
            break;
          case 'ARROWRIGHT':
            searchCol = Math.min(15, searchCol + 1);
            break;
        }
        
        // If we've reached the edge, stop searching
        if ((key === 'ARROWUP' && searchRow === 0) ||
            (key === 'ARROWDOWN' && searchRow === 15) ||
            (key === 'ARROWLEFT' && searchCol === 0) ||
            (key === 'ARROWRIGHT' && searchCol === 15)) {
          break;
        }
      }
    }
  };

  // Combo timer effect
  useEffect(() => {
    let interval;
    if (comboTimer > 0 && gameState === 'playing') {
      interval = setInterval(() => {
        setComboTimer(prev => {
          const newTime = prev - 100;
          if (newTime <= 0) {
            // Combo expired
            setComboMultiplier(0);
            setComboScore(0);
            Animated.timing(comboBarWidth, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }).start();
            return 0;
          }
          
          // Update combo bar animation
          const percentage = (newTime / COMBO_DURATION) * 100;
          Animated.timing(comboBarWidth, {
            toValue: percentage,
            duration: 100,
            useNativeDriver: false,
          }).start();
          
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [comboTimer, gameState]);

  // Update hint when board changes (only in easy mode)
  useEffect(() => {
    if (gameState === 'playing' && difficulty === 'easy' && board) {
      const hint = getNextValueToTackle(board);
      setNextValueHint(hint);
    } else {
      setNextValueHint(null);
    }
  }, [board, gameState, difficulty]);

  // Format time display
  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle successful move and combo logic
  const handleSuccessfulMove = () => {
    const moveScore = BASE_SCORE * Math.max(1, comboMultiplier);
    
    if (comboTimer > 0) {
      // Extend combo
      setComboMultiplier(prev => prev + 1);
      setComboScore(prev => prev + moveScore);
    } else {
      // Start new combo
      setComboMultiplier(1);
      setComboScore(moveScore);
    }
    
    // Reset combo timer to full duration
    setComboTimer(COMBO_DURATION);
    
    // Add to total score
    setTotalScore(prev => prev + moveScore);
    
    // Animate combo bar to full
    Animated.timing(comboBarWidth, {
      toValue: 100,
      duration: 200,
      useNativeDriver: false,
    }).start();
    
    // Enhanced haptic feedback for combos
    if (comboMultiplier >= 3) {
      safeHapticImpact(Haptics.ImpactFeedbackStyle.Heavy);
    } else {
      safeHapticSuccess();
    }
  };

  // Start new game
  const startNewGame = (selectedDifficulty) => {
    const { puzzle, solution } = generatePuzzle(selectedDifficulty);
    setBoard(puzzle);
    setInitialBoard(puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameStartTime(Date.now());
    setElapsedTime(0);
    setDifficulty(selectedDifficulty);
    setGameState('playing');
    setConflicts([]);
    setNextValueHint(null);
    
    // Reset combo and score state
    setComboTimer(0);
    setComboMultiplier(0);
    setTotalScore(0);
    setComboScore(0);
    comboBarWidth.setValue(0);
  };

  // Secret testing mode - accessible by long press on title
  const activateTestMode = () => {
    const { puzzle, solution } = generatePuzzle('test');
    setBoard(puzzle);
    setInitialBoard(puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameStartTime(Date.now());
    setElapsedTime(0);
    setDifficulty('test');
    setGameState('playing');
    setConflicts([]);
    setNextValueHint(null);
    
    // Reset combo and score state
    setComboTimer(0);
    setComboMultiplier(0);
    setTotalScore(0);
    setComboScore(0);
    comboBarWidth.setValue(0);
  };

  // Handle cell selection
  const selectCell = (row, col) => {
    if (initialBoard && initialBoard[row][col] !== null) {
      return; // Can't select pre-filled cells
    }
    
    safeHapticSelection();
    setSelectedCell([row, col]);
  };

  // Handle hex value input
  const inputValue = (value) => {
    if (!selectedCell || !board) return;
    
    const [row, col] = selectedCell;
    if (initialBoard[row][col] !== null) return; // Can't modify pre-filled cells
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = value;
    
    // Check for conflicts
    const newConflicts = getConflicts(newBoard, row, col);
    setConflicts(newConflicts);
    
    if (newConflicts.length === 0) {
      // Successful move - trigger combo logic
      handleSuccessfulMove();
    } else {
      // Failed move - reset combo
      setComboTimer(0);
      setComboMultiplier(0);
      setComboScore(0);
      Animated.timing(comboBarWidth, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      safeHapticError();
    }
    
    setBoard(newBoard);
    
    // Check if solved
    console.log('Checking if solved...');
    if (isSolved(newBoard)) {
      console.log('Game is solved!');
      setGameState('won');
      
      // Bonus score for completion
      const completionBonus = 1000;
      const finalScore = totalScore + completionBonus;
      setTotalScore(prev => prev + completionBonus);
      
      safeHapticSuccess();
      
      // Use setTimeout to ensure state updates are processed first
      setTimeout(() => {
        console.log('Showing congratulations alert');
        setWinData({
          time: formatTime(elapsedTime),
          score: finalScore
        });
        setShowWinModal(true);
      }, 500);
    } else {
      console.log('Game not solved yet');
    }
  };

  // Clear cell
  const clearCell = () => {
    if (!selectedCell || !board) return;
    
    const [row, col] = selectedCell;
    if (initialBoard[row][col] !== null) return;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = null;
    setBoard(newBoard);
    setConflicts([]);
    safeHapticSelection();
  };

  // Render combo bar
  const renderComboBar = () => {
    if (comboMultiplier === 0) return null;
    
    const comboColor = comboMultiplier >= 5 ? '#FF6B35' : 
                      comboMultiplier >= 3 ? '#FFB347' : '#4CAF50';
    
    return (
      <View style={styles.comboContainer}>
        <View style={styles.comboInfo}>
          <Text style={styles.comboText}>
            🔥 Combo x{comboMultiplier} 
          </Text>
          <Text style={styles.comboScoreText}>
            +{comboScore} pts
          </Text>
        </View>
        <View style={styles.comboBarContainer}>
          <Animated.View 
            style={[
              styles.comboBar,
              { 
                backgroundColor: comboColor,
                width: comboBarWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                })
              }
            ]} 
          />
        </View>
        <Text style={styles.comboTimeText}>
          {Math.ceil(comboTimer / 1000)}s
        </Text>
      </View>
    );
  };

  // Render game cell
  const renderCell = (row, col) => {
    const value = board ? board[row][col] : null;
    const isSelected = selectedCell && selectedCell[0] === row && selectedCell[1] === col;
    const isPrefilled = initialBoard && initialBoard[row][col] !== null;
    const hasConflict = conflicts.some(([r, c]) => r === row && c === col);
    
    // Get the color for this hex value
    const textColor = value ? HEX_COLORS[value] : '#333333';
    
    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          isSelected && styles.selectedCell,
          isPrefilled && styles.prefilledCell,
          hasConflict && styles.conflictCell,
          // Add borders for sub-grid separation (4x4 sub-grids)
          ((row + 1) % 4 === 0 && row < 15 && styles.subGridBorderBottom),
          ((col + 1) % 4 === 0 && col < 15 && styles.subGridBorderRight),
        ]}
        onPress={() => selectCell(row, col)}
      >
        <Text style={[
          styles.cellText,
          { color: textColor },
          isPrefilled && styles.prefilledText,
          hasConflict && styles.conflictText
        ]}>
          {value || ''}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render hex input button
  const renderHexButton = (value) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.hexButton,
        { backgroundColor: HEX_COLORS[value] }
      ]}
      onPress={() => inputValue(value)}
    >
      <Text style={[
        styles.hexButtonText,
        { color: getContrastColor(HEX_COLORS[value]) }
      ]}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  // Helper function to determine contrasting text color
  const getContrastColor = (hexColor) => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  };

  // Render win modal
  const renderWinModal = () => (
    <Modal
      visible={showWinModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowWinModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🎉 Congratulations! 🎉</Text>
          <Text style={styles.modalText}>
            You solved the hexadecimal Sudoku puzzle!
          </Text>
          <View style={styles.modalStats}>
            <Text style={styles.modalStatText}>Time: {winData.time}</Text>
            <Text style={styles.modalStatText}>Final Score: {winData.score} points</Text>
          </View>
          <Text style={styles.modalSubtext}>Great job!</Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={() => {
                setShowWinModal(false);
                setGameState('menu');
              }}
            >
              <Text style={styles.modalButtonText}>New Game</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonSecondary]}
              onPress={() => {
                setShowWinModal(false);
                setGameState('menu');
              }}
            >
              <Text style={styles.modalButtonTextSecondary}>Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render menu screen
  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="light" />
        <StatusBar backgroundColor="#1976D2" />
        
        <View style={styles.header}>
          <TouchableOpacity
            onLongPress={activateTestMode}
            delayLongPress={3000}
            activeOpacity={0.8}
          >
            <Text style={styles.title}>SUDOXU</Text>
          </TouchableOpacity>
          <Text style={styles.subtitle}>Hexadecimal Sudoku</Text>
        </View>
        
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Select Difficulty</Text>
          
          <TouchableOpacity
            style={[styles.difficultyButton, styles.easyButton]}
            onPress={() => startNewGame('easy')}
          >
            <Text style={styles.difficultyButtonText}>Easy</Text>
            <Text style={styles.difficultyDescription}>~196 filled cells + hints</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.difficultyButton, styles.mediumButton]}
            onPress={() => startNewGame('medium')}
          >
            <Text style={styles.difficultyButtonText}>Medium</Text>
            <Text style={styles.difficultyDescription}>~156 filled cells</Text>
          </TouchableOpacity>
          
          <View style={styles.hexExplanation}>
            <Text style={styles.hexExplanationTitle}>What is Hexadecimal?</Text>
            <Text style={styles.hexExplanationText}>
              Hexadecimal uses 16 symbols instead of the usual 10 digits. It goes: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F
            </Text>
            <Text style={styles.hexExplanationSubtext}>
              Each symbol represents a value from 0 to 15. Think of A=10, B=11, C=12, D=13, E=14, F=15
            </Text>
            <Text style={styles.hexExplanationWhy}>
              Why 16? It's perfect for computers! Since computers use binary (base-2), and 16 is 2⁴, each hex digit represents exactly 4 binary digits. This makes hex incredibly useful in programming and digital systems.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render game screen
  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />
      <StatusBar backgroundColor="#1976D2" />
      
      {/* Win Modal */}
      {renderWinModal()}
      
      <View style={styles.header}>
        <View style={styles.statsContainer}>
          <View style={styles.statColumn}>
            <TouchableOpacity
              style={[styles.headerButton, styles.menuHeaderButton]}
              onPress={() => setGameState('menu')}
            >
              <Text style={styles.headerButtonText}>Menu</Text>
            </TouchableOpacity>
            <Text style={styles.timer}>Time: {formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.statColumn}>
            <TouchableOpacity
              style={[styles.headerButton, styles.newGameHeaderButton]}
              onPress={() => startNewGame(difficulty)}
            >
              <Text style={styles.headerButtonText}>New Game</Text>
            </TouchableOpacity>
            <Text style={styles.scoreText}>Score: {totalScore}</Text>
          </View>
        </View>
      </View>
      
      {/* Combo Bar */}
      {renderComboBar()}
      
      {/* Hint bar for easy mode */}
      {difficulty === 'easy' && nextValueHint && nextValueHint.value && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            💡 Focus on: <Text style={[styles.hintValue, { color: HEX_COLORS[nextValueHint.value] }]}>
              {nextValueHint.value}
            </Text> ({nextValueHint.percentage}% complete, {nextValueHint.remaining} remaining)
          </Text>
        </View>
      )}
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View 
          style={styles.gameBoard}
          // Make the game board focusable on web for keyboard input
          {...(Platform.OS === 'web' && { tabIndex: 0 })}
        >
          {Array.from({ length: 16 }, (_, row) => (
            <View key={row} style={styles.row}>
              {Array.from({ length: 16 }, (_, col) => renderCell(row, col))}
            </View>
          ))}
        </View>
        
        <View style={styles.inputPanel}>
          <View style={styles.hexGrid}>
            {HEX_VALUES.map(value => renderHexButton(value))}
          </View>
          <TouchableOpacity style={[styles.hexButton, styles.clearButton]} onPress={clearCell}>
            <Text style={styles.hexButtonText}>Clear</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <View style={styles.keyboardHint}>
              <Text style={styles.keyboardHintText}>
                💡 Use keyboard: 0-9, A-F to input • Arrow keys to navigate • Backspace to clear
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 3,
    textShadowColor: '#00FF00',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  statColumn: {
    alignItems: 'center',
    flex: 1,
  },
  headerButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    minWidth: 70,
    alignItems: 'center',
  },
  menuHeaderButton: {
    backgroundColor: 'rgba(255,255,255,0.2)', // Semi-transparent white
  },
  newGameHeaderButton: {
    backgroundColor: 'rgba(76,175,80,0.8)', // Semi-transparent green
  },
  headerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  scoreText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  comboContainer: {
    backgroundColor: '#FFF8E1',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB74D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comboInfo: {
    flex: 1,
  },
  comboText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  comboScoreText: {
    fontSize: 12,
    color: '#FF6F00',
    fontWeight: '600',
  },
  comboBarContainer: {
    flex: 2,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  comboBar: {
    height: '100%',
    borderRadius: 4,
  },
  comboTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    minWidth: 25,
    textAlign: 'center',
  },
  hintBar: {
    backgroundColor: '#FFF3E0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB74D',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
    textAlign: 'center',
  },
  hintValue: {
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: '#333',
  },
  hexExplanation: {
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  hexExplanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
    textAlign: 'center',
  },
  hexExplanationText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 6,
  },
  hexExplanationSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hexExplanationWhy: {
    fontSize: 13,
    color: '#1976D2',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  difficultyButton: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  easyButton: {
    backgroundColor: '#4CAF50', // Green
  },
  mediumButton: {
    backgroundColor: '#FF9800', // Orange
  },
  difficultyButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  difficultyDescription: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  gameBoard: {
    alignSelf: 'center',
    marginTop: 10,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 20,
    height: 20,
    borderWidth: 0.5,
    borderColor: '#666666',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedCell: {
    backgroundColor: '#FFF59D',
  },
  prefilledCell: {
    backgroundColor: '#E3F2FD',
  },
  conflictCell: {
    borderColor: '#FF0000',
    borderWidth: 2,
    backgroundColor: '#FFEBEE', // Light red background for conflicts
  },
  subGridBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  subGridBorderRight: {
    borderRightWidth: 2,
    borderRightColor: '#000000',
  },
  cellText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  prefilledText: {
    fontWeight: '900', // Extra bold for pre-filled cells
  },
  conflictText: {
    textShadowColor: '#FF0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  inputPanel: {
    marginTop: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  keyboardHint: {
    backgroundColor: '#E8F5E8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  keyboardHintText: {
    fontSize: 12,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  hexGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: 320,
  },
  hexButton: {
    width: 45,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  clearButton: {
    backgroundColor: '#F44336',
    width: 100,
    marginTop: 10,
    borderColor: '#D32F2F',
  },
  hexButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '90%',
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalStats: {
    alignItems: 'center',
    marginBottom: 15,
  },
  modalStatText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  modalSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 25,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#2196F3',
  },
  modalButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonTextSecondary: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
});