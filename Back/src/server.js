const app = require('./app');
const { sequelize } = require('./models');
const seedData = require('./seed/seedData');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await seedData();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error al inicializar la aplicación', error);
    process.exit(1);
  }
}

startServer();
