import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { Card, CardStatus } from '../types';
import type { Description } from '../types';
import ReactMarkdown from 'react-markdown';
import { cardService } from '../services/cardService';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #2c3e50;
  border-radius: 4px;
  padding: 2rem;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #ecf0f1;
  
  &:hover {
    color: #3498db;
  }
`;

const Title = styled.h2`
  margin: 0 0 1rem 0;
  color: #ecf0f1;
`;

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  color: #bdc3c7;
  font-size: 0.9rem;
  text-transform: uppercase;
`;

const Description = styled.div`
  background: #34495e;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
`;

const Metadata = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  font-size: 0.8rem;
  color: #bdc3c7;
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  color: #ecf0f1;
`;

const CommitLink = styled.a`
  color: #3498db;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const EditButton = styled.button`
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  padding: 0.25rem;
  margin-left: 0.5rem;
  font-size: 0.8rem;
  
  &:hover {
    color: #3498db;
  }
`;

const EditInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #34495e;
  border-radius: 3px;
  margin-bottom: 0.5rem;
  background: #34495e;
  color: #ecf0f1;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const StatusSelect = styled.select`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #34495e;
  border-radius: 3px;
  margin-bottom: 0.5rem;
  background: #34495e;
  color: #ecf0f1;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const DescriptionTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #34495e;
  border-radius: 3px;
  margin-bottom: 0.5rem;
  min-height: 100px;
  resize: vertical;
  background: #34495e;
  color: #ecf0f1;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const SaveButton = styled.button`
  background: #3498db;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  margin-right: 0.5rem;
  
  &:hover {
    background: #2980b9;
  }
`;

const CancelButton = styled.button`
  background: #34495e;
  color: #ecf0f1;
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  
  &:hover {
    background: #2c3e50;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  margin-top: 0.5rem;
`;

const DescriptionTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: #ecf0f1;
`;

const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Tag = styled.span`
  background: #3498db;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
`;

const AddDescriptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid #34495e;
  border-radius: 4px;
  background: #2c3e50;
  color: #ecf0f1;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const TextArea = styled.textarea`
  padding: 0.5rem;
  border: 1px solid #34495e;
  border-radius: 4px;
  background: #2c3e50;
  color: #ecf0f1;
  min-height: 100px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const AddButton = styled.button`
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background: #2980b9;
  }
`;

const DeleteButton = styled.button`
  background: #e74c3c;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 0.5rem;
  
  &:hover {
    background: #c0392b;
  }
`;

interface CardDetailProps {
  card: Card;
  boardId: string;
  onClose: () => void;
  onCardUpdate: (updatedCard: Card) => void;
}

export const CardDetail: React.FC<CardDetailProps> = ({ card, boardId, onClose, onCardUpdate }) => {
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [newDescription, setNewDescription] = useState('');
  const [newDescriptionTitle, setNewDescriptionTitle] = useState('');
  const [newDescriptionTags, setNewDescriptionTags] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');

  useEffect(() => {
    const loadDescriptions = async () => {
      try {
        const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
        setDescriptions(loadedDescriptions);
      } catch (error) {
        console.error('Failed to load descriptions:', error);
      }
    };

    loadDescriptions();
  }, [boardId, card.id]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getCommitUrl = (repo: string, commit: string) => {
    const httpsRepo = repo.replace('git@github.com:', 'https://github.com/');
    return `${httpsRepo}/commit/${commit}`;
  };

  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditedValue(value);
  };

  const handleSave = async () => {
    try {
      let updates: Partial<Card> = {};
      
      if (editingField === 'status') {
        updates = { status: editedValue as CardStatus };
      } else if (editingField === 'assignee') {
        updates = { assignee: editedValue };
      }

      const updatedCard = await cardService.updateCard(boardId, card.id, updates);
      onCardUpdate(updatedCard.card);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  const handleAddDescription = async () => {
    if (!newDescription.trim()) return;
    
    try {
      const tags = newDescriptionTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const updatedCard = await cardService.addDescription(
        boardId, 
        card.id, 
        newDescription,
        newDescriptionTitle,
        tags
      );
      const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
      setDescriptions(loadedDescriptions);
      setNewDescription('');
      setNewDescriptionTitle('');
      setNewDescriptionTags('');
      onCardUpdate(updatedCard.card);
    } catch (error) {
      console.error('Failed to add description:', error);
    }
  };

  const handleDeleteDescription = async (index: number) => {
    try {
      const updatedCard = await cardService.deleteDescription(boardId, card.id, index);
      const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
      setDescriptions(loadedDescriptions);
      onCardUpdate(updatedCard.card);
    } catch (error) {
      console.error('Failed to delete description:', error);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        <Title>{card.title}</Title>
        
        <Metadata>
          <MetadataItem>
            <Label>Status</Label>
            {editingField === 'status' ? (
              <>
                <StatusSelect
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                >
                  <option value="todo">Todo</option>
                  <option value="doing">Doing</option>
                  <option value="done">Done</option>
                </StatusSelect>
                <ButtonGroup>
                  <SaveButton onClick={handleSave}>Save</SaveButton>
                  <CancelButton onClick={() => setEditingField(null)}>Cancel</CancelButton>
                </ButtonGroup>
              </>
            ) : (
              <>
                <Value>{card.status}</Value>
                <EditButton onClick={() => handleEdit('status', card.status)}>Edit</EditButton>
              </>
            )}
          </MetadataItem>
          <MetadataItem>
            <Label>Assignee</Label>
            {editingField === 'assignee' ? (
              <>
                <EditInput
                  type="text"
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                />
                <ButtonGroup>
                  <SaveButton onClick={handleSave}>Save</SaveButton>
                  <CancelButton onClick={() => setEditingField(null)}>Cancel</CancelButton>
                </ButtonGroup>
              </>
            ) : (
              <>
                <Value>{card.assignee}</Value>
                <EditButton onClick={() => handleEdit('assignee', card.assignee)}>Edit</EditButton>
              </>
            )}
          </MetadataItem>
          <MetadataItem>
            <Label>Created</Label>
            <Value>{new Date(card.createdAt).toLocaleString()}</Value>
          </MetadataItem>
          <MetadataItem>
            <Label>Last Updated</Label>
            <Value>{new Date(card.updatedAt).toLocaleString()}</Value>
          </MetadataItem>
        </Metadata>

        <Section>
          <SectionTitle>Codebase</SectionTitle>
          <CommitLink 
            href={getCommitUrl(card.codebase.repo, card.codebase.commit)}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Commit
          </CommitLink>
        </Section>

        <Section>
          <SectionTitle>Descriptions</SectionTitle>
          {descriptions.map((description, index) => (
            <Description key={index}>
              <DescriptionTitle>{description.title}</DescriptionTitle>
              {description.tags && description.tags.length > 0 && (
                <Tags>
                  {description.tags.map((tag: string, tagIndex: number) => (
                    <Tag key={tagIndex}>{tag}</Tag>
                  ))}
                </Tags>
              )}
              <ReactMarkdown>{description.content}</ReactMarkdown>
              <DeleteButton onClick={() => handleDeleteDescription(index)}>
                Delete
              </DeleteButton>
            </Description>
          ))}
          <AddDescriptionContainer>
            <Input
              type="text"
              placeholder="Description Title"
              value={newDescriptionTitle}
              onChange={(e) => setNewDescriptionTitle(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Tags (comma-separated)"
              value={newDescriptionTags}
              onChange={(e) => setNewDescriptionTags(e.target.value)}
            />
            <TextArea
              placeholder="Add a new description..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <AddButton onClick={handleAddDescription}>Add Description</AddButton>
          </AddDescriptionContainer>
        </Section>
      </Modal>
    </Overlay>
  );
}; 