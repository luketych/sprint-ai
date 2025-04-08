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
  descriptions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CardFolder {
  id: string;
  path: string;
  card: Card;
}

export interface Board {
  id: string;
  name: string;
  repoUrl: string;
  cards: CardFolder[];
} 