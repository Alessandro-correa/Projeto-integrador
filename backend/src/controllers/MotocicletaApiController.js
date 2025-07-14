
const db = require('../config/database');

class MotocicletaApiController {
  // Criar motocicleta
  async create(req, res) {
    try {
      let { placa, ano, cor, modelo, cilindrada, clienteCpf, ordemDeServicoCod } = req.body;
      placa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

      if (!placa || !ano || !cor || !modelo || !cilindrada || !clienteCpf) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Validar formato do CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(clienteCpf)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de CPF inválido. Use o formato: XXX.XXX.XXX-XX'
        });
      }

      // Validar ano
      const anoAtual = new Date().getFullYear();
      if (ano < 1900 || ano > (anoAtual + 1)) {
        return res.status(400).json({
          success: false,
          message: 'Ano inválido. Use um ano entre 1900 e ' + (anoAtual + 1)
        });
      }

      // Verificar se cliente existe
      const cliente = await db.oneOrNone('SELECT cpf FROM Cliente WHERE cpf = $1', [clienteCpf]);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      const query = `
        INSERT INTO Motocicleta (placa, ano, cor, modelo, cilindrada, cliente_cpf, ordem_de_servico_cod)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const novaMotocicleta = await db.one(query, [placa, ano, cor, modelo, cilindrada, clienteCpf, ordemDeServicoCod || null]);

      res.status(201).json({
        success: true,
        message: 'Motocicleta criada com sucesso',
        data: novaMotocicleta
      });

    } catch (error) {
      console.error('Erro ao criar motocicleta:', error, JSON.stringify(error));
      if (error.code === '23505' || (error.message && error.message.includes('duplicate key'))) {
        return res.status(409).json({
          success: false,
          message: 'Já existe uma motocicleta cadastrada com esta placa.'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar todas as motocicletas
  async findAll(req, res) {
    try {
      const motocicletas = await db.any(`
        SELECT m.*, c.nome AS cliente
        FROM Motocicleta m
        LEFT JOIN Cliente c ON m.cliente_cpf = c.cpf
        ORDER BY m.placa
      `);
      
      res.json({
        success: true,
        data: motocicletas,
        count: motocicletas.length
      });

    } catch (error) {
      console.error('Erro ao listar motocicletas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar motocicleta por placa
  async findOne(req, res) {
    try {
      const { placa } = req.params;

      const motocicleta = await db.oneOrNone('SELECT * FROM Motocicleta WHERE placa = $1', [placa]);

      if (!motocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      res.json({
        success: true,
        data: motocicleta
      });

    } catch (error) {
      console.error('Erro ao buscar motocicleta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Atualizar motocicleta
  async update(req, res) {
    try {
      const { placa } = req.params;
      const { ano, cor, modelo, cilindrada, clienteCpf, ordemDeServicoCod } = req.body;

      const existingMotocicleta = await db.oneOrNone('SELECT * FROM Motocicleta WHERE placa = $1', [placa]);
      if (!existingMotocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      const query = `
        UPDATE Motocicleta 
        SET ano = $1, cor = $2, modelo = $3, cilindrada = $4, cliente_cpf = $5, ordem_de_servico_cod = $6
        WHERE placa = $7
        RETURNING *
      `;

      const motocicletaAtualizada = await db.one(query, [ano, cor, modelo, cilindrada, clienteCpf, ordemDeServicoCod || null, placa]);

      res.json({
        success: true,
        message: 'Motocicleta atualizada com sucesso',
        data: motocicletaAtualizada
      });

    } catch (error) {
      console.error('Erro ao atualizar motocicleta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Remover motocicleta
  async delete(req, res) {
    try {
      let { placa } = req.params;
      placa = placa.toUpperCase().replace(/[^A-Z0-9]/g, '');

      const motocicletas = await db.any('SELECT * FROM Motocicleta');
      const existingMotocicleta = motocicletas.find(m => m.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === placa);
      if (!existingMotocicleta) {
        return res.status(404).json({
          success: false,
          message: 'Motocicleta não encontrada'
        });
      }

      await db.none('DELETE FROM Motocicleta WHERE placa = $1', [existingMotocicleta.placa]);

      res.json({
        success: true,
        message: 'Motocicleta removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover motocicleta:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar motocicletas por cliente
  async findByCliente(req, res) {
    try {
      const { clienteCpf } = req.params;

      // Verificar se cliente existe
      const cliente = await db.oneOrNone('SELECT cpf FROM Cliente WHERE cpf = $1', [clienteCpf]);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      const motocicletas = await db.any(`
        SELECT m.*, c.nome as nome_cliente
        FROM Motocicleta m 
        LEFT JOIN Cliente c ON m.cliente_cpf = c.cpf 
        WHERE m.cliente_cpf = $1
        ORDER BY m.placa
      `, [clienteCpf]);

      res.json({
        success: true,
        data: motocicletas,
        count: motocicletas.length
      });

    } catch (error) {
      console.error('Erro ao buscar motocicletas por cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new MotocicletaApiController(); 