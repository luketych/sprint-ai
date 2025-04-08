import React, { useState } from 'react';
import styled from '@emotion/styled';
import { cardService } from '../services/cardService';
import { CardStatus } from '../types';

const AddCardContainer = styled.div`
  margin-bottom: 1rem;
`;

const AddCardButton = styled.button`
  background: #f4f5f7;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  width: 100%;
  text-align: left;
  color: #5e6c84;
  
  &:hover {
    background: #e4e6ea;
  }
`;

const CardForm = styled.form`
  background: white;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 1px 0 rgba(9, 30, 66, 0.25);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: 1px solid #dfe1e6;
  border-radius: 3px;
  
  &:focus {
    outline: none;
    border-color: #4c9aff;
  }
`;

const FormButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const SubmitButton = styled.button`
  background: #0052cc;
  color: white;
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  
  &:hover {
    background: #0065ff;
  }
`;

const CancelButton = styled.button`
  background: #f4f5f7;
  color: #5e6c84;
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  
  &:hover {
    background: #e4e6ea;
  }
`;

interface AddCardProps {
  boardId: string;
  status: CardStatus;
  onCardAdded: () => void;
}

export const AddCard: React.FC<AddCardProps> = ({ boardId, status, onCardAdded }) => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [repo, setRepo] = useState('');
  const [commit, setCommit] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await cardService.createCard(boardId, {
        title,
        status,
        assignee,
        codebase: {
          repo,
          commit,
        }
      });
      
      setTitle('');
      setAssignee('');
      setRepo('');
      setCommit('');
      setIsFormVisible(false);
      onCardAdded();
    } catch (error) {
      console.error('Failed to create card:', error);
    }
  };

  if (!isFormVisible) {
    return (
      <AddCardContainer>
        <AddCardButton onClick={() => setIsFormVisible(true)}>
          + Add a card
        </AddCardButton>
      </AddCardContainer>
    );
  }

  return (
    <AddCardContainer>
      <CardForm onSubmit={handleSubmit}>
        <FormInput
          type="text"
          placeholder="Card title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <FormInput
          type="text"
          placeholder="Assignee"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          required
        />
        <FormInput
          type="text"
          placeholder="Repository URL"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          required
        />
        <FormInput
          type="text"
          placeholder="Commit hash"
          value={commit}
          onChange={(e) => setCommit(e.target.value)}
          required
        />
        <FormButtons>
          <SubmitButton type="submit">Add Card</SubmitButton>
          <CancelButton type="button" onClick={() => setIsFormVisible(false)}>
            Cancel
          </CancelButton>
        </FormButtons>
      </CardForm>
    </AddCardContainer>
  );
}; 