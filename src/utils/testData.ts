import { Card } from '../types';

export const generateTestCards = (count: number): Omit<Card, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const statuses: Card['status'][] = ['todo', 'doing', 'done'];
  const assignees = ['vscode:clide', 'vscode:roo', 'cursor'];
  const repos = [
    'https://github.com/microsoft/vscode',
    'https://github.com/getcursor/cursor',
    'https://github.com/openai/openai-python'
  ];
  const commits = [
    'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
    'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
    'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2'
  ];

  // Create a sample card first
  const sampleCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
    title: 'Sample Card',
    status: 'todo',
    assignee: 'vscode:clide',
    codebase: {
      repo: 'https://github.com/microsoft/vscode',
      commit: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
    }
  };

  // Generate random cards
  const randomCards = Array.from({ length: count - 1 }, (_, i) => ({
    title: `Task ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assignee: assignees[Math.floor(Math.random() * assignees.length)],
    codebase: {
      repo: repos[Math.floor(Math.random() * repos.length)],
      commit: commits[Math.floor(Math.random() * commits.length)]
    }
  }));

  return [sampleCard, ...randomCards];
}; 