import { cardService } from '../src/services/cardService';
import { generateTestCards } from '../src/utils/testData';

const BOARD_ID = 'sample-board';

async function populateTestData() {
  try {
    // Generate 10 test cards
    const testCards = generateTestCards(10);
    
    // Create each card
    for (const card of testCards) {
      await cardService.createCard(BOARD_ID, card);
      console.log(`Created card: ${card.title}`);
    }
    
    console.log('Test data population completed successfully!');
  } catch (error) {
    console.error('Error populating test data:', error);
  }
}

populateTestData();
