require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT) || 3100;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Backend URL: http://localhost:${port}`);
});
