import React, { useState } from 'react';
import styled from '@emotion/styled';
import { Board } from '../types';

const MenuContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: white;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const MenuContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #172b4d;
`;

const Button = styled.button`
  background: #0052cc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    background: #0065ff;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1001;
`;

const ModalContent = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 4px;
  width: 100%;
  max-width: 500px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #dfe1e6;
  border-radius: 4px;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    border-color: #0052cc;
  }
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #5e6c84;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
`;

const CancelButton = styled(Button)`
  background: #dfe1e6;
  color: #172b4d;
  
  &:hover {
    background: #c1c7d0;
  }
`;

const ErrorText = styled.div`
  color: #de350b;
  font-size: 0.9rem;
  margin-left: 1rem;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid #dfe1e6;
  border-radius: 4px;
  font-size: 1rem;
  background-color: white;
  margin-right: 1rem;
  min-width: 200px;
  color: #172b4d;
  
  &:focus {
    outline: none;
    border-color: #0052cc;
  }

  option {
    color: #172b4d;
    background-color: white;
  }
`;

interface BoardMenuProps {
  currentBoard: Board | null;
  availableBoards: Board[];
  onBoardSelect: (board: Board) => void;
  onBoardCreate: (name: string, repoUrl: string) => void;
}

export const BoardMenu: React.FC<BoardMenuProps> = ({
  currentBoard,
  availableBoards,
  onBoardSelect,
  onBoardCreate,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onBoardCreate(newBoardName, newRepoUrl);
      setError(null);
    } catch (err) {
      setError('Failed to create board');
    }
    setShowModal(false);
    setNewBoardName('');
    setNewRepoUrl('');
  };

  return (
    <>
      <MenuContainer>
        <MenuContent>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Title>Sprint Lanes</Title>
            <Select
              aria-label="Select a board"
              value={currentBoard?.id || ''} 
              onChange={(e) => {
                const board = availableBoards.find(b => b.id === e.target.value);
                if (board) onBoardSelect(board);
              }}
            >
              <option value="" disabled>Select a Board</option>
              {availableBoards.map(board => (
                <option key={board.id} value={board.id}>
                  {board.name}
                </option>
              ))}
            </Select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button onClick={() => setShowModal(true)}>
            Create New Board
            </Button>
            {error && <ErrorText>{error}</ErrorText>}
          </div>
        </MenuContent>
      </MenuContainer>

      {showModal && (
        <Modal>
          <ModalContent>
            <Form onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="boardName">Board Name</Label>
                <Input
                  id="boardName"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="repoUrl">Repository URL</Label>
                <Input
                  id="repoUrl"
                  value={newRepoUrl}
                  onChange={(e) => setNewRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  required
                />
              </div>
              <ButtonGroup>
                <CancelButton type="button" onClick={() => setShowModal(false)}>
                  Cancel
                </CancelButton>
                <Button type="submit">Create Board</Button>
              </ButtonGroup>
            </Form>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};
