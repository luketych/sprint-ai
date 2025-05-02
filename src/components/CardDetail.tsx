import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import type { Card, CardStatus, Description, DescriptionMetadata } from '../types';
import ReactMarkdown from 'react-markdown';
import { cardService } from '../services/cardService';
import { fileSystemService } from '../services/fileSystemService';
import { v4 as uuidv4 } from 'uuid';

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

const TagBubble = styled.div<{ selected: boolean }>`
  display: inline-block;
  padding: 0.5rem 1rem;
  margin: 0.25rem;
  border-radius: 20px;
  background: ${({ selected }) => (selected ? '#3498db' : '#34495e')};
  color: #ecf0f1;
  cursor: pointer;
  transition: background 0.3s;

  &:hover {
    background: #2980b9;
  }
`;

const descriptionTitleOptions = [
  "Purpose",
  "Things I will have to figure out by playing around",
  "Uncertainties",
  "What does done look like?",
  "What does good enough look like?",
  "What tests should be passed?",
  "Constants: What can't be changed?",
  "New Technologies:",
  "Potential Strategies for implementing card."
];

interface CardDetailProps {
  card: Card;
  boardId: string;
  onClose: () => void;
  onCardUpdate: (updatedCard: Card) => void;
}

const createThumbnail = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const scaleFactor = 100 / img.width;
      canvas.width = 100;
      canvas.height = img.height * scaleFactor;
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Thumbnail creation failed.'));
        }
      }, 'image/jpeg');
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const CardDetail: React.FC<CardDetailProps> = ({ card, boardId, onClose, onCardUpdate }) => {
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [descriptionMetadata, setDescriptionMetadata] = useState<Record<string, DescriptionMetadata>>({});
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
  const [usedTitles, setUsedTitles] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<{ image: string; thumbnail: string }[]>([]);

  const loadDescriptions = async () => {
    try {
      const loadedDescriptions = await cardService.getDescriptions(boardId, card.id);
      setDescriptions(loadedDescriptions);

      // Load metadata
      const metadataPath = `${boardId}/${card.id}/descriptions/metadata.json`;
      try {
        const metadataContent = await fileSystemService.readTextFile(metadataPath);
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

  const loadImages = async () => {
    try {
      const files = await fileSystemService.listDirectory(`uploads/${boardId}/${card.id}`);
      const images: { image: string; thumbnail: string }[] = [];

      for (const file of files) {
        if (file.startsWith('thumbnail')) continue;

        const image = `/uploads/${boardId}/${card.id}/${file}`;
        const thumbnail = `/uploads/${boardId}/${card.id}/thumbnail_${file}`;

        images.push({ image, thumbnail });
      }
      setImageUrls(images);
    } catch (error) {
      console.error('Failed to load images:', error);
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

  const handleEditTitleSelect = (title: string) => {
    setEditingDescription({ ...editingDescription, title: title });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.warn('No files selected');
      return;
    }

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      console.warn('Not an image file');
      return;
    }

    try {
      // Create parent directory first
      await fileSystemService.createUploadsDirectory(`${boardId}/${card.id}`);

      // Create thumbnail
      const thumbnailBlob = await createThumbnail(file);
      const thumbnailFile = new File([thumbnailBlob], `thumbnail_${file.name}`, { type: 'image/jpeg' });

      // Upload image and thumbnail
      // const formData = new FormData();
      // formData.append('image', file);
      // formData.append('thumbnail', thumbnailFile);

      // const imageUrls = await cardService.uploadImage(boardId, card.id, formData);
      // setImageUrls(imageUrls);

      const imageBuffer = await file.arrayBuffer();
      const thumbnailBuffer = await thumbnailFile.arrayBuffer();

      await fileSystemService.writeFile(
        `${boardId}/${card.id}/${file.name}`,
        imageBuffer // Pass ArrayBuffer directly
      );
      await fileSystemService.writeFile(
        `${boardId}/${card.id}/thumbnail_${file.name}`,
        thumbnailBuffer // Pass ArrayBuffer directly
      );

      setImageUrls([{ 
          image: `/uploads/${boardId}/${card.id}/${file.name}`, 
          thumbnail: `/uploads/${boardId}/${card.id}/thumbnail_${file.name}` 
      }]);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleDeleteImage = async (imagePath: string, thumbnailPath: string) => {
    try {
      // Extract relative path for API call (remove leading '/uploads/')
      const relativeImagePath = imagePath.replace(/^\/uploads\//, '');
      const relativeThumbnailPath = thumbnailPath.replace(/^\/uploads\//, '');

      // Delete both files using the service
      await fileSystemService.deleteFileFromUploads(relativeImagePath);
      await fileSystemService.deleteFileFromUploads(relativeThumbnailPath);

      // Update state to remove the image entry
      setImageUrls(prevUrls => prevUrls.filter(url => url.image !== imagePath));
      console.log(`Deleted image and thumbnail: ${relativeImagePath}`);

    } catch (error) {
      console.error(`Error deleting image ${imagePath}:`, error);
      // Optionally, show an error message to the user
    }
  };

  const availableTitleOptions = descriptionTitleOptions.filter(option => !usedTitles.includes(option));

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <TitleInput
          type="text"
          value={card.title}
          onChange={(e) => handleEdit('title', e.target.value)}
          onKeyDown={(e) => {
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
                  onChange={(e) => handleEdit('status', e.target.value)}
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
                  onChange={(e) => setEditedValue(e.target.value)}
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
                  <div>
                    {availableTitleOptions.map(option => (
                      <TagBubble
                        key={option}
                        selected={editingDescription.title === option}
                        onClick={() => handleEditTitleSelect(option)}
                      />
                    ))}
                  </div>
                  <DescriptionTextarea
                    value={editingDescription.content}
                    onChange={(e) => setEditingDescription({ ...editingDescription, content: e.target.value })}
                    placeholder="Description"
                  />
                  <EditInput
                    type="text"
                    value={editingDescription.tags}
                    onChange={(e) => setEditingDescription({ ...editingDescription, tags: e.target.value })}
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
            <div>
              {availableTitleOptions.map(option => (
                <TagBubble
                  key={option}
                  selected={newDescriptionTitle === option}
                  onClick={() => setNewDescriptionTitle(option)}
                >
                  {option}
                </TagBubble>
              ))}
            </div>
            <Input
              type="text"
              placeholder="Title"
              value={newDescriptionTitle}
              onChange={(e) => setNewDescriptionTitle(e.target.value)}
            />
            <TextArea
              placeholder="Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
            <Input
              type="text"
              placeholder="Tags (comma-separated)"
              value={newDescriptionTags}
              onChange={(e) => setNewDescriptionTags(e.target.value)}
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
          {imageUrls.map(({ image, thumbnail }) => (
            <div key={image}>
              <img src={thumbnail} alt="thumbnail" />
              <DeleteButton onClick={() => handleDeleteImage(image, thumbnail)}>Delete</DeleteButton>
            </div>
          ))}
        </Section>
      </Modal>
    </Overlay>
  );
};
