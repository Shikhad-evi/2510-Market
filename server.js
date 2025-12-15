const app = require('./app');
const client = require('./db/client');

const PORT = 3000;

client.connect();

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});