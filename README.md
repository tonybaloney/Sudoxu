# Sudoxu - Hexadecimal Sudoku Mobile Game

A mobile Sudoku game using 16x16 grids with hexadecimal values (0-F) instead of traditional 1-9 numbers.

## Features

- **16x16 Hexadecimal Grid**: Uses values 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, A, B, C, D, E, F
- **Three Difficulty Levels**: Easy, Medium, and Hard
- **Mobile-Optimized Interface**: Touch-friendly design with haptic feedback
- **Real-time Validation**: Immediate conflict detection and highlighting
- **Timer**: Track your solving time
- **Responsive Design**: Works on both phones and tablets
- **Color-Coded Values**: Each hex value has a unique color for easy visual scanning

## Game Rules

- Fill the 16x16 grid so that every row contains all hex values 0-F
- Every column must contain all hex values 0-F  
- Each 4x4 sub-grid must contain all hex values 0-F
- No duplicates allowed in any row, column, or sub-grid

## Difficulty Levels

- **Easy**: ~196 pre-filled cells (60 empty out of 256) + hints
- **Medium**: ~116 pre-filled cells (140 empty out of 256)  
- **Hard**: ~76 pre-filled cells (180 empty out of 256)

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Expo CLI globally:**
   ```bash
   npm install -g expo-cli
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device:**
   - **Android**: `npm run android` or scan QR code with Expo Go app
   - **iOS**: `npm run ios` or scan QR code with Expo Go app
   - **Web**: `npm run web`

### Project Structure

```
Sudoxu/
├── App.js                 # Main application component
├── utils/
│   └── gameLogic.js       # Game logic and puzzle generation
├── assets/                # Images and icons
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
└── babel.config.js       # Babel configuration
```

## How to Play

1. **Select Difficulty**: Choose from Easy, Medium, or Hard
2. **Tap a Cell**: Select an empty cell to input a value
3. **Choose Hex Value**: Tap a hex button (0-F) to fill the cell
4. **Clear Mistakes**: Tap 'Clear' to clear the selected cell
5. **Win Condition**: Fill all cells correctly to win!

## Technical Details

- **Framework**: React Native with Expo
- **State Management**: React Hooks
- **Haptic Feedback**: Expo Haptics
- **Storage**: AsyncStorage for persistence
- **Platform Support**: iOS 14+, Android 8+ (API 26+)

## Future Enhancements

- [ ] Undo/Redo functionality
- [ ] Daily challenges
- [ ] Leaderboards
- [ ] Multiple themes
- [ ] Note-taking in cells
- [ ] Auto-save progress
- [ ] Sound effects toggle
- [ ] High contrast mode

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on the GitHub repository.
