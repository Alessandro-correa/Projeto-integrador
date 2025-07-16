// Configuração do banco de dados PostgreSQL

require('dotenv').config();

const pgp = require('pg-promise')({
  error(err, e) {
    console.error('Erro no pg-promise:', err.message || err);
  }
});

const usuario = process.env.DB_USER || 'postgres';
const senha = process.env.DB_PASSWORD || 'root';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME || 'oficina';

const connectionConfig = {
  host: host,
  port: port,
  database: dbName,
  user: usuario,
  password: senha,
  ssl: false,
  charset: 'utf8',
  client_encoding: 'UTF8'
};

const db = pgp(connectionConfig);

module.exports = db;