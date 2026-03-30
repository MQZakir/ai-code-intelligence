const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('========================================');
  console.log(`Backend server running on port ${PORT}`);
  console.log('========================================');
  console.log('Available routes:');
  console.log('- GET /api/runtime/detect');
  console.log('========================================');
}); 