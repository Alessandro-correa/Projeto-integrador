require('dotenv').config();

const pgp = require('pg-promise')({
  error(err, e) {
    console.error('Erro no pg-promise:', err.message || err);
  }
});

const usuario = process.env.DB_USER || 'postgres';
const senha = process.env.DB_PASSWORD || '123456';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 5432;
const dbName = process.env.DB_NAME || 'oficina';

const connectionString = `postgres://${usuario}:${senha}@${host}:${port}/${dbName}`;

if (!connectionString.startsWith('postgres://')) {
  throw new Error('String de conexão inválida');
}

const db = pgp(connectionString);

module.exports = db;
