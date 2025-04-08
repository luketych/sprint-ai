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

export interface Description {
  name: string;
  body: string;
}

export interface CardFolder {
  id: string;
  card: Card;
  path: string;
}

export interface Board {
  id: string;
  name: string;
  repoUrl: string;
  cards: CardFolder[];
} 