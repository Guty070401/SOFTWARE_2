// src/app.js
const express = require('express');
require('dotenv').config();
const { sequelize } = require('./models');  // importa instancia de Sequelize
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(express.json());  // parsear JSON
const cors = require('cors');
app.use(cors());  // habilitar CORS según se requiera (configurable)

// Registrar rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Ruta de prueba o salud
app.get('/api/health', (req, res) => {
  res.send('API funcionando');
});

// Middleware de manejo de errores (al final de las rutas)
app.use(errorMiddleware);

// Conectar a la base de datos y luego iniciar el servidor
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexión a DB exitosa');
    // Sincronizar modelos con la base de datos en desarrollo (opcional)
    // await sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
    process.exit(1);
  }
})();
