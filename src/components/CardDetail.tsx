import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { Card, Description, DescriptionMetadata } from '../types';
import ReactMarkdown from 'react-markdown';
import { cardService } from '../services/cardService';
import ImageTiles from './ImageTiles'; // Ensure ImageTiles is imported
import ImageModal from './ImageModal'; // Import the new modal component

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
  z-index: 1001; /* Ensure it's above the overlay content */
`;

const Modal = styled.div`
  background: #2c3e50;
  border-radius: 4px;
  padding: 2rem;
  width: 800px;
  max-width: 100vw;
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

const Section = styled.div`
  margin-bottom: 20px;
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

interface CardDetailProps {
  card: Card;
  boardId: string;
  onClose: () => void;
  onCardUpdate: (updatedCard: Card) => void;
}

export const CardDetail: React.FC<CardDetailProps> = ({ card, boardId, onClose, onCardUpdate }) => {
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [descriptionMetadata, setDescriptionMetadata] = useState<DescriptionMetadata | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [newDescriptionTitle, setNewDescriptionTitle] = useState('');
  const [newDescriptionTags, setNewDescriptionTags] = useState('');
  const [editingDescription, setEditingDescription] = useState<{
    description: Description | null;
    content: string;
    title: string;
    tags: string;
  }>({
    description: null,
    content: "",
    title: "",
    tags: "",
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const loadDescriptions = async () => {
    try {
      const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
      setDescriptions(loadedDescriptions);

      // Load metadata
      const metadataPath = `${boardId}/${card.id}/descriptions/metadata.json`;
      try {
        // TODO: Implement cardService.readTextFile or equivalent API call
        // const metadataContent = await cardService.readTextFile(metadataPath);
        // const metadata = JSON.parse(metadataContent.trim());
        // setDescriptionMetadata(metadata);
        console.warn(`Metadata loading skipped for ${metadataPath} - requires cardService implementation`);
      } catch (error) {
        console.error('Error loading description metadata:', error);
        setDescriptionMetadata(null); // Reset or handle error state
      }
    } catch (error) {
      console.error('Failed to load descriptions:', error);
    }
  };

  const loadImages = async () => {
    if (!boardId || !card?.id) return; // Guard clause
    try {
      console.log(`[CardDetail] Calling getCardImages for board ${boardId}, card ${card.id}`);
      const fetchedImageUrls = await cardService.getCardImages(boardId, card.id);
      console.log('[CardDetail] Fetched image URLs from service:', fetchedImageUrls);
      setImageUrls(fetchedImageUrls);
    } catch (error) {
      console.error('[CardDetail] Error in loadImages:', error);
      setImageUrls([]); // Ensure state is empty on error
    }
  };

  useEffect(() => {
    console.log('Loading card:', card);
    console.log('Board ID:', boardId);
    loadDescriptions();
    loadImages();
  }, [boardId, card.id]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (card.status === 'done') {
      document.body.classList.add('card-done');
    } else {
      document.body.classList.remove('card-done');
    }

    return () => {
      document.body.classList.remove('card-done');
    };
  }, [card.status]);

  const getCommitUrl = (repo: string, commit: string) => {
    return `https://github.com/${repo}/commit/${commit}`;
  };

  const handleEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditedValue(value);
  };

  const handleSave = async () => {
    if (!editingField) return;

    const updates: Partial<Card> = {
      [editingField]: editedValue,
    };

    setEditingField(null);
    setEditedValue('');

    const updatedCard = await cardService.updateCard(boardId, card.id, updates);
    onCardUpdate(updatedCard.card);
  };

  const handleAddDescription = async () => {
    if (!newDescriptionTitle || !newDescription) return;

    const tags = newDescriptionTags.split(',').map(tag => tag.trim()).filter(tag => tag);
    await cardService.addDescription(
      boardId,
      card.id,
      newDescription,
      newDescriptionTitle,
      tags
    );

    setNewDescription('');
    setNewDescriptionTitle('');
    setNewDescriptionTags('');

    const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
    setDescriptions(loadedDescriptions);
  };

  const handleDeleteDescription = async (index: number) => {
    try {
      await cardService.deleteDescription(boardId, card.id, index);
      const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
      setDescriptions(loadedDescriptions);
    } catch (error) {
      console.error('Failed to delete description:', error);
    }
  };

  const handleEditDescription = (description: Description) => {
    setEditingDescription({
      description: description,
      content: description.content,
      title: description.title,
      tags: description.tags.join(', '),
    });
  };

  const handleSaveDescription = async () => {
    if (!editingDescription.description || !editingDescription.title) return;

    const tags = editingDescription.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    await cardService.updateDescription(
      boardId,
      card.id,
      editingDescription.description.id,
      {
        content: editingDescription.content,
        title: editingDescription.title,
        tags: tags,
      }
    );

    setEditingDescription({ ...editingDescription, description: null });

    const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
    setDescriptions(loadedDescriptions);
  };

  const handleCancelEdit = () => {
    setEditingDescription({ ...editingDescription, description: null });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file || !boardId || !card?.id) return;

    const formData = new FormData();
    formData.append('images', file); // Use 'images' as the field name, matching backend

    const uploadUrl = `/api/boards/${boardId}/cards/${card.id}/upload-images`;
    console.log(`[CardDetail] Uploading image to: ${uploadUrl}`);

    try {
      const response = await fetch(uploadUrl, { 
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Attempt to get error details
        console.error('[CardDetail] Upload failed:', response.status, response.statusText, errorData);
        throw new Error(`Image upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[CardDetail] Upload successful, result:', result);

      // Assuming the backend returns the new path(s) correctly
      // Use the path returned by the backend, which should now include board/card IDs
      const newImageUrl = result.paths && result.paths.length > 0 ? result.paths[0] : null;
      if (newImageUrl) {
        setImageUrls(prev => [...prev, newImageUrl]);
      } else {
        console.warn('[CardDetail] Upload response did not contain expected path:', result);
      }

    } catch (error) {
      console.error('[CardDetail] Error during image upload fetch:', error);
    }
  };

  const handleDeleteImage = async (imagePathToDelete: string) => {
    try {
      const filename = imagePathToDelete.split('/').pop();
      if (!filename) throw new Error('Could not extract filename');
      const response = await fetch(`/api/uploads/${filename}`, { method: 'DELETE' });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete: ${response.statusText}`);
      }
      setImageUrls(prevUrls => prevUrls.filter(url => url !== imagePathToDelete));
      console.log(`Deleted image: ${filename}`);
    } catch (error) {
      console.error(`Error deleting image ${imagePathToDelete}:`, error);
    }
  };

  const handleImageTileClick = (url: string) => {
    console.log('[CardDetail] Image tile clicked:', url);
    setSelectedImageUrl(url);
  };

  const handleCloseModal = () => {
    setSelectedImageUrl(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  console.log('[CardDetail] Rendering with imageUrls:', imageUrls); // Log state before render

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <EditInput
          type="text"
          value={card.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleEdit('title', e.target.value)}
          onKeyDown={(e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
              handleSave();
            }
          }}
        />
        <ButtonGroup>
          {editingField === 'title' ? (
            <>
              <SaveButton onClick={handleSave}>Save</SaveButton>
              <CancelButton onClick={() => {
                setEditingField(null);
                setEditedValue('');
              }}>Cancel</CancelButton>
            </>
          ) : (
            <EditButton onClick={() => handleEdit('title', card.title)}>Edit Title</EditButton>
          )}
        </ButtonGroup>

        <Metadata>
          <MetadataItem>
            <Label>Status</Label>
            {editingField === 'status' ? (
              <>
                <StatusSelect
                  value={card.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleEdit('status', e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="in progress">In Progress</option>
                  <option value="done">Done</option>
                </StatusSelect>
                <ButtonGroup>
                  <SaveButton onClick={handleSave}>Save</SaveButton>
                  <CancelButton onClick={() => {
                    setEditingField(null);
                    setEditedValue('');
                  }}>Cancel</CancelButton>
                </ButtonGroup>
              </>
            ) : (
              <>
                <Value>{card.status}</Value>
                <ButtonGroup>
                  <EditButton onClick={() => handleEdit('status', card.status)}>Edit Status</EditButton>
                </ButtonGroup>
              </>
            )}
          </MetadataItem>
          <MetadataItem>
            <Label>Codebase</Label>
            {editingField === 'codebase' ? (
              <>
                <EditInput
                  type="text"
                  value={editedValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedValue(e.target.value)}
                  placeholder="Repo/Commit"
                />
                <ButtonGroup>
                  <SaveButton onClick={handleSave}>Save</SaveButton>
                  <CancelButton onClick={() => {
                    setEditingField(null);
                    setEditedValue('');
                  }}>Cancel</CancelButton>
                </ButtonGroup>
              </>
            ) : (
              <>
                <Value>{card.codebase.repo}</Value>
                <Value>{card.codebase.commit}</Value>
                <ButtonGroup>
                  <EditButton onClick={() => handleEdit('codebase', `${card.codebase.repo}/${card.codebase.commit}`)}>Edit Codebase</EditButton>
                </ButtonGroup>
              </>
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
              {editingDescription.description?.id === description.id ? (
                <>
                  <DescriptionTextarea
                    value={editingDescription.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingDescription({ ...editingDescription, content: e.target.value })}
                    placeholder="Description"
                  />
                  <EditInput
                    type="text"
                    value={editingDescription.tags}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingDescription({ ...editingDescription, tags: e.target.value })}
                    placeholder="Tags (comma-separated)"
                  />
                  <ButtonGroup>
                    <SaveButton onClick={handleSaveDescription}>Save</SaveButton>
                    <CancelButton onClick={handleCancelEdit}>Cancel</CancelButton>
                  </ButtonGroup>
                </>
              ) : (
                <>
                  {description.title && <h3>{description.title}</h3>}
                  <ReactMarkdown>{description.content}</ReactMarkdown>
                  {description.tags.length > 0 && (
                    <Tags>
                      {description.tags.map((tag: string, i: number) => (
                        <Tag key={i}>{tag}</Tag>
                      ))}
                    </Tags>
                  )}
                  {descriptionMetadata && (
                    <DescriptionMetadata>
                      <TimestampItem>
                        <Label>Created</Label>
                        <Value>{formatDate(descriptionMetadata.createdAt)}</Value>
                      </TimestampItem>
                      <TimestampItem>
                        <Label>Last Updated</Label>
                        <Value>{formatDate(descriptionMetadata.updatedAt)}</Value>
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
            <Input
              type="text"
              placeholder="Title"
              value={newDescriptionTitle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDescriptionTitle(e.target.value)}
            />
            <TextArea
              placeholder="Description"
              value={newDescription}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDescription(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Tags (comma-separated)"
              value={newDescriptionTags}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewDescriptionTags(e.target.value)}
            />
            <AddButton onClick={handleAddDescription}>Add Description</AddButton>
          </AddDescriptionContainer>
        </Section>

        <Section>
          <SectionTitle>Images</SectionTitle>
          <input
            type="file"
            accept="image/*"
            multiple={false}
            onChange={handleImageUpload}
          />
          <ImageTiles 
            imageUrls={imageUrls} 
            onDelete={handleDeleteImage} 
            onImageClick={handleImageTileClick} 
          />
        </Section>
      </Modal>
      {selectedImageUrl && (
        <ImageModal imageUrl={selectedImageUrl} onClose={handleCloseModal} />
      )}
    </Overlay>
  );
};
