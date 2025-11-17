// Back/src/server.js
const app = require('./app');
const seedData = require('./seed/seedData');

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  await seedData();
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('No se pudo iniciar el servidor:', err);
  process.exit(1);
});
