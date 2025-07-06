const db = require('../config/db');

class ClienteController {
  // Criar cliente
  async create(req, res) {
    try {
      const { cpf, nome, sexo, endereco, telefone, email, profissao, dataDeNascimento } = req.body;

      // Validações
      if (!cpf || !nome || !sexo || !endereco || !telefone || !email || !profissao || !dataDeNascimento) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Validar formato do CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(cpf)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de CPF inválido. Use o formato: XXX.XXX.XXX-XX'
        });
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Validar sexo
      if (!['Masculino', 'Feminino'].includes(sexo)) {
        return res.status(400).json({
          success: false,
          message: 'Sexo deve ser "Masculino" ou "Feminino"'
        });
      }

      // Validar data de nascimento
      const dataNasc = new Date(dataDeNascimento);
      if (isNaN(dataNasc.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Data de nascimento inválida'
        });
      }

      // Verificar se CPF já existe
      const existingCpf = await db.oneOrNone('SELECT cpf FROM Cliente WHERE cpf = $1', [cpf]);
      if (existingCpf) {
        return res.status(409).json({
          success: false,
          message: 'CPF já cadastrado'
        });
      }

      // Verificar se email já existe
      const existingEmail = await db.oneOrNone('SELECT email FROM Cliente WHERE email = $1', [email]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }

      const query = `
        INSERT INTO Cliente (cpf, nome, sexo, endereco, telefone, email, profissao, data_de_nascimento)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const novoCliente = await db.one(query, [cpf, nome, sexo, endereco, telefone, email, profissao, dataDeNascimento]);

      res.status(201).json({
        success: true,
        message: 'Cliente criado com sucesso',
        data: novoCliente
      });

    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar todos os clientes
  async findAll(req, res) {
    try {
      const clientes = await db.any('SELECT * FROM Cliente ORDER BY nome');
      
      res.json({
        success: true,
        data: clientes,
        count: clientes.length
      });

    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar cliente por CPF
  async findOne(req, res) {
    try {
      const { cpf } = req.params;

      const cliente = await db.oneOrNone('SELECT * FROM Cliente WHERE cpf = $1', [cpf]);

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      res.json({
        success: true,
        data: cliente
      });

    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Atualizar cliente
  async update(req, res) {
    try {
      const { cpf } = req.params;
      const { nome, sexo, endereco, telefone, email, profissao, dataDeNascimento } = req.body;

      // Verificar se cliente existe
      const existingCliente = await db.oneOrNone('SELECT * FROM Cliente WHERE cpf = $1', [cpf]);
      if (!existingCliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      // Validações
      if (!nome || !sexo || !endereco || !telefone || !email || !profissao || !dataDeNascimento) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Validar sexo
      if (!['Masculino', 'Feminino'].includes(sexo)) {
        return res.status(400).json({
          success: false,
          message: 'Sexo deve ser "Masculino" ou "Feminino"'
        });
      }

      // Validar data de nascimento
      const dataNasc = new Date(dataDeNascimento);
      if (isNaN(dataNasc.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Data de nascimento inválida'
        });
      }

      // Verificar se email já existe (exceto para o cliente atual)
      const existingEmail = await db.oneOrNone('SELECT email FROM Cliente WHERE email = $1 AND cpf != $2', [email, cpf]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado por outro cliente'
        });
      }

      const query = `
        UPDATE Cliente 
        SET nome = $1, sexo = $2, endereco = $3, telefone = $4, email = $5, profissao = $6, data_de_nascimento = $7
        WHERE cpf = $8
        RETURNING *
      `;

      const clienteAtualizado = await db.one(query, [nome, sexo, endereco, telefone, email, profissao, dataDeNascimento, cpf]);

      res.json({
        success: true,
        message: 'Cliente atualizado com sucesso',
        data: clienteAtualizado
      });

    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Remover cliente
  async delete(req, res) {
    try {
      const { cpf } = req.params;

      // Verificar se cliente existe
      const existingCliente = await db.oneOrNone('SELECT * FROM Cliente WHERE cpf = $1', [cpf]);
      if (!existingCliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      // Verificar se há motocicletas vinculadas
      const motosVinculadas = await db.oneOrNone('SELECT placa FROM Motocicleta WHERE cliente_cpf = $1', [cpf]);
      if (motosVinculadas) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover cliente que possui motocicletas vinculadas'
        });
      }

      // Verificar se há orçamentos vinculados
      const orcamentosVinculados = await db.oneOrNone('SELECT id FROM Orcamento WHERE cliente_cpf = $1', [cpf]);
      if (orcamentosVinculados) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover cliente que possui orçamentos vinculados'
        });
      }

      await db.none('DELETE FROM Cliente WHERE cpf = $1', [cpf]);

      res.json({
        success: true,
        message: 'Cliente removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new ClienteController(); 