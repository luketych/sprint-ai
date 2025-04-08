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
  const descriptions = [
    'Implement user authentication',
    'Add dark mode support',
    'Fix performance issues',
    'Update documentation',
    'Refactor component structure',
    'Add unit tests',
    'Implement error handling',
    'Optimize database queries',
    'Add new feature X',
    'Fix bug in Y component'
  ];

  // Create a sample card first
  const sampleCard: Omit<Card, 'id' | 'createdAt' | 'updatedAt'> = {
    title: 'Sample Card',
    status: 'todo',
    assignee: 'vscode:clide',
    codebase: {
      repo: 'https://github.com/microsoft/vscode',
      commit: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0'
    },
    descriptions: ['This is a sample card showing the correct assignee format']
  };

  // Generate random cards
  const randomCards = Array.from({ length: count - 1 }, (_, i) => ({
    title: `Task ${i + 1}`,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    assignee: assignees[Math.floor(Math.random() * assignees.length)],
    codebase: {
      repo: repos[Math.floor(Math.random() * repos.length)],
      commit: commits[Math.floor(Math.random() * commits.length)]
    },
    descriptions: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      () => descriptions[Math.floor(Math.random() * descriptions.length)]
    )
  }));

  return [sampleCard, ...randomCards];
}; 