import { useState, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Board as BoardComponent } from './components/Board'
import { BoardMenu } from './components/BoardMenu'
import { Board } from './types/index'
import { boardService } from './services/boardService'

function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [availableBoards, setAvailableBoards] = useState<Board[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadBoards = async () => {
    try {
      const boards = await boardService.getBoards();
      setAvailableBoards(boards);
      const board = boards.find(b => b.id === boardId);
      if (board) {
        setCurrentBoard(board);
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
  }, [boardId]);

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
        onBoardSelect={(board) => navigate(`/boards/${board.id}`)}
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
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/boards/:boardId" element={<BoardView />} />
        <Route path="/" element={<BoardView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import './App.css';
