const db = require('../config/db');

class UsuarioController {
  // Criar usuário
  async create(req, res) {
    try {
      const { cpf, nome, funcao, senha, email, telefone, codigo } = req.body;

      // Validações
      if (!cpf || !nome || !funcao || !senha || !email || !telefone || !codigo) {
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

      // Verificar se CPF já existe
      const existingCpf = await db.oneOrNone('SELECT cpf FROM Usuario WHERE cpf = $1', [cpf]);
      if (existingCpf) {
        return res.status(409).json({
          success: false,
          message: 'CPF já cadastrado'
        });
      }

      // Verificar se email já existe
      const existingEmail = await db.oneOrNone('SELECT email FROM Usuario WHERE email = $1', [email]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }

      // Verificar se telefone já existe
      const existingTelefone = await db.oneOrNone('SELECT telefone FROM Usuario WHERE telefone = $1', [telefone]);
      if (existingTelefone) {
        return res.status(409).json({
          success: false,
          message: 'Telefone já cadastrado'
        });
      }

      // Verificar se código já existe
      const existingCodigo = await db.oneOrNone('SELECT codigo FROM Usuario WHERE codigo = $1', [codigo]);
      if (existingCodigo) {
        return res.status(409).json({
          success: false,
          message: 'Código já cadastrado'
        });
      }

      const query = `
        INSERT INTO Usuario (cpf, nome, funcao, senha, email, telefone, codigo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const novoUsuario = await db.one(query, [cpf, nome, funcao, senha, email, telefone, codigo]);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: novoUsuario
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar todos os usuários
  async findAll(req, res) {
    try {
      const usuarios = await db.any('SELECT * FROM Usuario ORDER BY nome');
      
      res.json({
        success: true,
        data: usuarios,
        count: usuarios.length
      });

    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Buscar usuário por CPF
  async findOne(req, res) {
    try {
      const { cpf } = req.params;

      const usuario = await db.oneOrNone('SELECT * FROM Usuario WHERE cpf = $1', [cpf]);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: usuario
      });

    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Atualizar usuário
  async update(req, res) {
    try {
      const { cpf } = req.params;
      const { nome, funcao, senha, email, telefone, codigo } = req.body;

      // Verificar se usuário existe
      const existingUsuario = await db.oneOrNone('SELECT * FROM Usuario WHERE cpf = $1', [cpf]);
      if (!existingUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Validações
      if (!nome || !funcao || !senha || !email || !telefone || !codigo) {
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

      // Verificar se email já existe (exceto para o usuário atual)
      const existingEmail = await db.oneOrNone('SELECT email FROM Usuario WHERE email = $1 AND cpf != $2', [email, cpf]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado por outro usuário'
        });
      }

      // Verificar se telefone já existe (exceto para o usuário atual)
      const existingTelefone = await db.oneOrNone('SELECT telefone FROM Usuario WHERE telefone = $1 AND cpf != $2', [telefone, cpf]);
      if (existingTelefone) {
        return res.status(409).json({
          success: false,
          message: 'Telefone já cadastrado por outro usuário'
        });
      }

      // Verificar se código já existe (exceto para o usuário atual)
      const existingCodigo = await db.oneOrNone('SELECT codigo FROM Usuario WHERE codigo = $1 AND cpf != $2', [codigo, cpf]);
      if (existingCodigo) {
        return res.status(409).json({
          success: false,
          message: 'Código já cadastrado por outro usuário'
        });
      }

      const query = `
        UPDATE Usuario 
        SET nome = $1, funcao = $2, senha = $3, email = $4, telefone = $5, codigo = $6
        WHERE cpf = $7
        RETURNING *
      `;

      const usuarioAtualizado = await db.one(query, [nome, funcao, senha, email, telefone, codigo, cpf]);

      res.json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: usuarioAtualizado
      });

    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Remover usuário
  async delete(req, res) {
    try {
      const { cpf } = req.params;

      // Verificar se usuário existe
      const existingUsuario = await db.oneOrNone('SELECT * FROM Usuario WHERE cpf = $1', [cpf]);
      if (!existingUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se há ordens de serviço vinculadas
      const ordensVinculadas = await db.oneOrNone('SELECT cod FROM Ordem_de_servico WHERE usuario_cpf = $1', [cpf]);
      if (ordensVinculadas) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover usuário que possui ordens de serviço vinculadas'
        });
      }

      await db.none('DELETE FROM Usuario WHERE cpf = $1', [cpf]);

      res.json({
        success: true,
        message: 'Usuário removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new UsuarioController(); 