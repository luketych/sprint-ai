import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { Card, CardStatus, Description, DescriptionMetadata } from '../types';
import ReactMarkdown from 'react-markdown';
import { cardService } from '../services/cardService';
import { fileSystemService } from '../services/fileSystemService';

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
  cursor: pointer;
  
  &:hover {
    color: #3498db;
  }
`;

const TitleInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin: 0 0 1rem 0;
  background: #34495e;
  border: 1px solid #3498db;
  border-radius: 4px;
  color: #ecf0f1;
  font-size: 1.5rem;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
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
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const MetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 120px;
`;

const Label = styled.span`
  font-size: 0.7rem;
  color: #bdc3c7;
  margin-bottom: 0.25rem;
`;

const Value = styled.span`
  color: #ecf0f1;
  font-size: 0.8rem;
`;

const ClickableValue = styled.div`
  color: #ecf0f1;
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.25rem 0;
  
  &:hover {
    color: #3498db;
  }
`;

const TimestampContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
`;

const TimestampItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
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

const DescriptionActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const EditDescriptionButton = styled.button`
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.8rem;
  
  &:hover {
    color: #3498db;
  }
`;

const DeleteDescriptionButton = styled.button`
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  padding: 0.25rem;
  font-size: 0.8rem;
  
  &:hover {
    color: #e74c3c;
  }
`;

const DescriptionMetadata = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #34495e;
  border-radius: 4px;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  align-items: center;
`;

const TitleSelect = styled.select`
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

const descriptionTitleOptions = [
  "What does done look like?",
  "What does good enough look like?",
  "What tests should be passed?",
  "Constants: What can't be changed?",
  "New Technologies:",
];

interface CardDetailProps {
  card: Card;
  boardId: string;
  onClose: () => void;
  onCardUpdate: (updatedCard: Card) => void;
}

export const CardDetail: React.FC<CardDetailProps> = ({ card, boardId, onClose, onCardUpdate }) => {
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [descriptionMetadata, setDescriptionMetadata] = useState<Record<string, DescriptionMetadata>>({});
  const [newDescription, setNewDescription] = useState('');
  const [newDescriptionTitle, setNewDescriptionTitle] = useState('');
  const [newDescriptionTags, setNewDescriptionTags] = useState('');
  const [editingDescription, setEditingDescription] = useState<Description | null>(null);
  const [editDescriptionContent, setEditDescriptionContent] = useState('');
  const [editDescriptionTitle, setEditDescriptionTitle] = useState('');
  const [editDescriptionTags, setEditDescriptionTags] = useState('');
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');

  const loadDescriptions = async () => {
    try {
      const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
      setDescriptions(loadedDescriptions);

      // Load metadata
      const metadataPath = `${boardId}/${card.id}/descriptions/metadata.json`;
      try {
        const metadataContent = await fileSystemService.readFile(metadataPath);
        const metadata = JSON.parse(metadataContent.trim());
        setDescriptionMetadata(metadata);
      } catch (error) {
        console.warn('No metadata file found');
        setDescriptionMetadata({});
      }
    } catch (error) {
      console.error('Failed to load descriptions:', error);
    }
  };

  useEffect(() => {
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
      } else if (editingField === 'title') {
        updates = { title: editedValue };
      }

      const updatedCard = await cardService.updateCard(boardId, card.id, updates);
      onCardUpdate(updatedCard.card);
      setEditingField(null);
    } catch (error) {
      console.error('Failed to update card:', error);
    }
  };

  const handleAddDescription = async () => {
    if (!newDescription.trim() || !newDescriptionTitle) return;
    
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

  const handleEditDescription = (description: Description) => {
    setEditingDescription(description);
    setEditDescriptionContent(description.content);
    setEditDescriptionTitle(descriptionTitleOptions.includes(description.title) ? description.title : '');
    setEditDescriptionTags(description.tags.join(', '));
  };

  const handleSaveDescription = async () => {
    if (!editingDescription || !editDescriptionTitle) return;

    try {
      const tags = editDescriptionTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      await cardService.updateDescription(
        boardId,
        card.id,
        editingDescription.id,
        {
          content: editDescriptionContent,
          title: editDescriptionTitle,
          tags
        }
      );
      setEditingDescription(null);
      loadDescriptions();
    } catch (error) {
      console.error('Error updating description:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingDescription(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}_${month}_${day}, ${hours}:${minutes}:${seconds}`;
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        {editingField === 'title' ? (
          <>
            <TitleInput
              value={editedValue}
              onChange={(e) => setEditedValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                } else if (e.key === 'Escape') {
                  setEditingField(null);
                }
              }}
              autoFocus
            />
            <ButtonGroup>
              <SaveButton onClick={handleSave}>Save</SaveButton>
              <CancelButton onClick={() => setEditingField(null)}>Cancel</CancelButton>
            </ButtonGroup>
          </>
        ) : (
          <Title onClick={() => handleEdit('title', card.title)}>
            {card.title}
          </Title>
        )}
        
        <Metadata>
          <MetadataItem>
            <Label>Status</Label>
            {editingField === 'status' ? (
              <>
                <StatusSelect
                  value={editedValue}
                  onChange={(e) => setEditedValue(e.target.value)}
                  autoFocus
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
              <ClickableValue onClick={() => handleEdit('status', card.status)}>
                {card.status}
              </ClickableValue>
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
                  autoFocus
                />
                <ButtonGroup>
                  <SaveButton onClick={handleSave}>Save</SaveButton>
                  <CancelButton onClick={() => setEditingField(null)}>Cancel</CancelButton>
                </ButtonGroup>
              </>
            ) : (
              <ClickableValue onClick={() => handleEdit('assignee', card.assignee)}>
                {card.assignee}
              </ClickableValue>
            )}
          </MetadataItem>
          <TimestampContainer>
            <TimestampItem>
              <Label>Created</Label>
              <Value>{formatDate(card.createdAt)}</Value>
            </TimestampItem>
            <TimestampItem>
              <Label>Last Updated</Label>
              <Value>{formatDate(card.updatedAt)}</Value>
            </TimestampItem>
          </TimestampContainer>
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
          {descriptions.map((description: Description, index) => (
            <Description key={description.id}>
              {editingDescription?.id === description.id ? (
                <>
                  <TitleSelect
                    value={editDescriptionTitle}
                    onChange={(e) => setEditDescriptionTitle(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select a title...</option>
                    {descriptionTitleOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </TitleSelect>
                  <DescriptionTextarea
                    value={editDescriptionContent}
                    onChange={(e) => setEditDescriptionContent(e.target.value)}
                    placeholder="Description"
                  />
                  <EditInput
                    type="text"
                    value={editDescriptionTags}
                    onChange={(e) => setEditDescriptionTags(e.target.value)}
                    placeholder="Tags (comma-separated)"
                  />
                  <ButtonGroup>
                    <SaveButton onClick={handleSaveDescription}>Save</SaveButton>
                    <CancelButton onClick={handleCancelEdit}>Cancel</CancelButton>
                  </ButtonGroup>
                </>
              ) : (
                <>
                  {description.title && <DescriptionTitle>{description.title}</DescriptionTitle>}
                  <ReactMarkdown>{description.content}</ReactMarkdown>
                  {description.tags.length > 0 && (
                    <Tags>
                      {description.tags.map((tag: string, i: number) => (
                        <Tag key={i}>{tag}</Tag>
                      ))}
                    </Tags>
                  )}
                  {descriptionMetadata[description.id] && (
                    <DescriptionMetadata>
                      <TimestampItem>
                        <Label>Created</Label>
                        <Value>{formatDate(descriptionMetadata[description.id].createdAt)}</Value>
                      </TimestampItem>
                      <TimestampItem>
                        <Label>Last Updated</Label>
                        <Value>{formatDate(descriptionMetadata[description.id].updatedAt)}</Value>
                      </TimestampItem>
                    </DescriptionMetadata>
                  )}
                  <DescriptionActions>
                    <EditDescriptionButton onClick={() => handleEditDescription(description)}>
                      Edit
                    </EditDescriptionButton>
                    <DeleteDescriptionButton onClick={() => handleDeleteDescription(index)}>
                      Delete
                    </DeleteDescriptionButton>
                  </DescriptionActions>
                </>
              )}
            </Description>
          ))}
          <AddDescriptionContainer>
            <TitleSelect
              value={newDescriptionTitle}
              onChange={(e) => setNewDescriptionTitle(e.target.value)}
              required
            >
              <option value="" disabled>Select a title...</option>
              {descriptionTitleOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </TitleSelect>
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