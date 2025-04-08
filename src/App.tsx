import { useState, useEffect } from 'react'
import { Board as BoardComponent } from './components/Board'
import { BoardMenu } from './components/BoardMenu'
import { Card, Board } from './types'
import { boardService } from './services/boardService'
import './App.css'

function App() {
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [availableBoards, setAvailableBoards] = useState<Board[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadBoards = async () => {
    try {
      const boards = await boardService.getBoards();
      setAvailableBoards(boards);
      if (boards.length > 0 && !currentBoard) {
        setCurrentBoard(boards[0]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to load boards. Please try again later.');
      console.error(err);
    }
  };

  const refreshBoard = async () => {
    if (!currentBoard) return;
    
    try {
      const updatedBoard = await boardService.getBoard(currentBoard.id);
      setCurrentBoard(updatedBoard);
      await loadBoards();  // Refresh the list to update any changes
      setError(null);
    } catch (err) {
      setError('Failed to refresh board. Please try again later.');
      console.error(err);
    }
  };

  useEffect(() => {
    loadBoards();
  }, []);

  const handleBoardCreate = async (name: string, repoUrl: string) => {
    try {
      const newBoard = await boardService.createBoard(name, repoUrl);
      setCurrentBoard(newBoard);
      await loadBoards();  // Refresh the list of boards
      setError(null);
    } catch (err) {
      setError('Failed to create board. Please try again later.');
      console.error(err);
    }
  };

  return (
    <div className="App">
      <BoardMenu
        currentBoard={currentBoard}
        availableBoards={availableBoards}
        onBoardSelect={setCurrentBoard}
        onBoardCreate={handleBoardCreate}
      />
      {error && <div className="error">{error}</div>}
      {currentBoard && (
        <div className="board-container">
          <BoardComponent 
            boardId={currentBoard.id}
            cards={currentBoard.cards} 
            onCardsChange={refreshBoard}
          />
        </div>
      )}
    </div>
  )
}

export default App
