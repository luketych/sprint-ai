import { Card, CardFolder } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export const apiService = {
  async getCards(): Promise<CardFolder[]> {
    const response = await fetch(`${API_BASE_URL}/cards`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }
    return response.json();
  },

  async createCard(card: Omit<Card, 'id' | 'createdAt' | 'updatedAt'>): Promise<CardFolder> {
    const response = await fetch(`${API_BASE_URL}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });
    if (!response.ok) {
      throw new Error('Failed to create card');
    }
    return response.json();
  },

  async updateCard(id: string, updates: Partial<Card>): Promise<CardFolder> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update card');
    }
    return response.json();
  },

  async addDescription(id: string, description: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/cards/${id}/descriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });
    if (!response.ok) {
      throw new Error('Failed to add description');
    }
  }
}; 