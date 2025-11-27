const { seedDatabase } = require('./seedData.ts');

// Run the seeding function
seedDatabase().then(() => {
  console.log('Seeding process completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
