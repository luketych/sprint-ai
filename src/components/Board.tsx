import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card, CardFolder, CardStatus } from '../types';
import { AddCard } from './AddCard';
import { CardDetail } from './CardDetail';
import { 
  DndContext, 
  DragEndEvent, 
  closestCorners, 
  useSensor, 
  useSensors, 
  PointerSensor,
  useDroppable 
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { cardService } from '../services/cardService';
import { useSearchParams } from 'react-router-dom';

const BoardContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  height: 100vh;
  background: #2c3e50;
`;

interface DroppableColumnProps {
  id: CardStatus;
  title: string;
  children: React.ReactNode;
}

const DroppableColumn: React.FC<DroppableColumnProps> = ({ id, title, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Column ref={setNodeRef} data-is-over={isOver}>
      <ColumnTitle>{title}</ColumnTitle>
      {children}
    </Column>
  );
};

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #34495e;
  border-radius: 4px;
  padding: 1rem;
  min-width: 300px;
  min-height: 100px;
  transition: background-color 0.2s ease;

  &[data-is-over="true"] {
    background-color: #2c3e50;
  }
`;

const ColumnTitle = styled.h2`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: #ecf0f1;
`;

interface DraggableCardProps {
  id: string;
  children: React.ReactNode;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.8 : 1,
    boxShadow: isDragging ? '0 8px 16px rgba(9, 30, 66, 0.25)' : undefined,
    background: isDragging ? '#e4e9f2' : undefined,
    cursor: 'grab'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const CardContainer = styled.div`
  user-select: none;
  background: #2c3e50;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
  cursor: pointer;
  
  &:hover {
    background: #34495e;
  }
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  color: #ecf0f1;
`;

const CardAssignee = styled.div`
  font-size: 0.8rem;
  color: #bdc3c7;
  margin-bottom: 0.5rem;
`;

const CommitLink = styled.a`
  font-size: 0.8rem;
  color: #3498db;
  text-decoration: none;
  display: block;
  margin-top: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

interface BoardProps {
  boardId: string;
  cards: CardFolder[];
  onCardsChange: () => void;
}

export const Board: React.FC<BoardProps> = ({ boardId, cards, onCardsChange }) => {
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load selected card from URL on initial render
  useEffect(() => {
    const cardId = searchParams.get('card');
    if (cardId) {
      const card = cards.find(folder => folder.card.id === cardId)?.card;
      if (card) {
        setSelectedCard(card);
      }
    }
  }, [cards, searchParams]);

  // Update URL when card is selected/deselected
  useEffect(() => {
    if (selectedCard) {
      searchParams.set('card', selectedCard.id);
    } else {
      searchParams.delete('card');
    }
    setSearchParams(searchParams);
  }, [selectedCard, searchParams, setSearchParams]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const cardId = active.id.toString();
    const newStatus = over.id.toString() as CardStatus;
    
    if (!['todo', 'doing', 'done'].includes(newStatus)) {
      return;
    }
    
    const cardToUpdate = cards.find(folder => folder.card.id === cardId);
    if (!cardToUpdate || cardToUpdate.card.status === newStatus) return;

    try {
      await cardService.updateCard(boardId, cardId, {
        status: newStatus
      });
      onCardsChange();
    } catch (error) {
      console.error('Failed to update card status:', error);
    }
  };

  const handleCardUpdate = (updatedCard: Card) => {
    onCardsChange();
  };

  const columns = {
    todo: cards.filter(folder => folder.card.status === 'todo'),
    doing: cards.filter(folder => folder.card.status === 'doing'),
    done: cards.filter(folder => folder.card.status === 'done'),
  };

  const getCommitUrl = (repo: string, commit: string) => {
    // Convert SSH URL to HTTPS if needed
    const httpsRepo = repo.replace('git@github.com:', 'https://github.com/');
    return `${httpsRepo}/commit/${commit}`;
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragCancel={() => onCardsChange()}
      collisionDetection={closestCorners} 
      onDragEnd={handleDragEnd}
    >
      <BoardContainer>
        <DroppableColumn id="todo" title="Todo">
          <AddCard boardId={boardId} status="todo" onCardAdded={onCardsChange} />
          {columns.todo.map(folder => (
            <DraggableCard key={folder.card.id} id={folder.card.id}>
              <CardContainer onClick={() => setSelectedCard(folder.card)}>
                <CardTitle>{folder.card.title}</CardTitle>
                <CardAssignee>Assignee: {folder.card.assignee}</CardAssignee>
                <CommitLink 
                  href={getCommitUrl(folder.card.codebase.repo, folder.card.codebase.commit)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Commit
                </CommitLink>
              </CardContainer>
            </DraggableCard>
          ))}
        </DroppableColumn>
        <DroppableColumn id="doing" title="Doing">
          <AddCard boardId={boardId} status="doing" onCardAdded={onCardsChange} />
          {columns.doing.map(folder => (
            <DraggableCard key={folder.card.id} id={folder.card.id}>
              <CardContainer onClick={() => setSelectedCard(folder.card)}>
                <CardTitle>{folder.card.title}</CardTitle>
                <CardAssignee>Assignee: {folder.card.assignee}</CardAssignee>
                <CommitLink 
                  href={getCommitUrl(folder.card.codebase.repo, folder.card.codebase.commit)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Commit
                </CommitLink>
              </CardContainer>
            </DraggableCard>
          ))}
        </DroppableColumn>
        <DroppableColumn id="done" title="Done">
          <AddCard boardId={boardId} status="done" onCardAdded={onCardsChange} />
          {columns.done.map(folder => (
            <DraggableCard key={folder.card.id} id={folder.card.id}>
              <CardContainer onClick={() => setSelectedCard(folder.card)}>
                <CardTitle>{folder.card.title}</CardTitle>
                <CardAssignee>Assignee: {folder.card.assignee}</CardAssignee>
                <CommitLink 
                  href={getCommitUrl(folder.card.codebase.repo, folder.card.codebase.commit)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Commit
                </CommitLink>
              </CardContainer>
            </DraggableCard>
          ))}
        </DroppableColumn>
      </BoardContainer>
      {selectedCard && (
        <CardDetail 
          card={selectedCard} 
          boardId={boardId}
          onClose={() => setSelectedCard(null)}
          onCardUpdate={handleCardUpdate}
        />
      )}
    </DndContext>
  );
};
