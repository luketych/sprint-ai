export type CardStatus = 'todo' | 'doing' | 'done';

export interface Card {
  id: string;
  title: string;
  status: CardStatus;
  assignee: string;
  codebase: {
    repo: string;
    commit: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CardFolder {
  id: string;
  card: Card;
  path: string;
}

export interface DescriptionMetadata {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Description {
  id: string;
  content: string;
  title: string;
  tags: string[];
} 