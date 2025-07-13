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
} from 'react-native';
import { StatusBar as Expo          <TouchableOpacity
            style={styles.difficultyButton}
            onPress={() => startNewGame('easy')}
          >
            <Text style={styles.difficultyButtonText}>Easy</Text>
            <Text style={styles.difficultyDescription}>~196 filled cells + hints</Text>
          </TouchableOpacity>ar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  '8': '#FF6347', // Tomato Red
  '9': '#32CD32', // Lime Green (medium brightness)
  'A': '#8844FF', // Blue Purple
  'B': '#FF1493', // Deep Pink
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
    setNextValueHint(null); // Reset hint
  };

  // Handle cell selection
  const selectCell = (row, col) => {
    if (initialBoard && initialBoard[row][col] !== null) {
      return; // Can't select pre-filled cells
    }
    
    Haptics.selectionAsync();
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    
    setBoard(newBoard);
    
    // Check if solved
    if (isSolved(newBoard)) {
      setGameState('won');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Congratulations!',
        `You solved the puzzle in ${formatTime(elapsedTime)}!`,
        [{ text: 'New Game', onPress: () => setGameState('menu') }]
      );
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
    Haptics.selectionAsync();
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

  // Render menu screen
  if (gameState === 'menu') {
    return (
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="light" />
        <StatusBar backgroundColor="#1976D2" />
        
        <View style={styles.header}>
          <Text style={styles.title}>SUDOXU</Text>
          <Text style={styles.subtitle}>Hexadecimal Sudoku</Text>
        </View>
        
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Select Difficulty</Text>
          
          <TouchableOpacity
            style={styles.difficultyButton}
            onPress={() => startNewGame('easy')}
          >
            <Text style={styles.difficultyButtonText}>Easy</Text>
            <Text style={styles.difficultyDescription}>~196 filled cells + hints</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.difficultyButton}
            onPress={() => startNewGame('medium')}
          >
            <Text style={styles.difficultyButtonText}>Medium</Text>
            <Text style={styles.difficultyDescription}>~116 filled cells</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.difficultyButton}
            onPress={() => startNewGame('hard')}
          >
            <Text style={styles.difficultyButtonText}>Hard</Text>
            <Text style={styles.difficultyDescription}>~76 filled cells</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render game screen
  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />
      <StatusBar backgroundColor="#1976D2" />
      
      <View style={styles.header}>
        <Text style={styles.title}>SUDOXU</Text>
        <Text style={styles.timer}>Time: {formatTime(elapsedTime)}</Text>
      </View>
      
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
        <View style={styles.gameBoard}>
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
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setGameState('menu')}
          >
            <Text style={styles.actionButtonText}>Menu</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => startNewGame(difficulty)}
          >
            <Text style={styles.actionButtonText}>New Game</Text>
          </TouchableOpacity>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#E3F2FD',
    marginTop: 4,
  },
  timer: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 8,
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
  difficultyButton: {
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
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
    fontSize: 10,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  actionButton: {
    backgroundColor: '#666666',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
