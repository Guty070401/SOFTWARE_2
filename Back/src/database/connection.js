const { Sequelize } = require('sequelize');

const database = process.env.DB_NAME || 'Software';
const username = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'Guty';
const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 5432;

const sequelize = new Sequelize(database, username, password, {
  host,
  port,
  dialect: 'postgres',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true
  }
});

module.exports = sequelize;
