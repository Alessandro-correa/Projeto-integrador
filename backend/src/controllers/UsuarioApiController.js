const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class UsuarioApiController {
  // Criar usuário
  async create(req, res) {
    try {
      console.log('Iniciando criação de usuário...');
      const { cpf, nome, funcao, senha, email, telefone } = req.body;
      console.log('Dados recebidos:', { cpf, nome, funcao, email, telefone, senha: senha ? '[HIDDEN]' : 'undefined' });

      // Validações
      if (!cpf || !nome || !funcao || !senha || !email || !telefone) {
        console.log('Validação falhou: campos obrigatórios');
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Função só pode ser Administrador, Mecânico ou Secretária
      const funcoesPermitidas = ['Administrador', 'Mecânico', 'Secretária'];
      if (!funcoesPermitidas.includes(funcao)) {
        console.log('Função inválida:', funcao);
        return res.status(400).json({
          success: false,
          message: 'Função inválida. Só é permitido Administrador, Mecânico ou Secretária.'
        });
      }

      // Validar formato do CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(cpf)) {
        console.log('CPF inválido:', cpf);
        return res.status(400).json({
          success: false,
          message: 'Formato de CPF inválido. Use o formato: XXX.XXX.XXX-XX'
        });
      }

      // Validar formato do email (regex + TLDs válidos)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z.]{2,}$/;
      const validTlds = [
        'com', 'net', 'org', 'edu', 'gov', 'mil', 'br',
        'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br'
      ];
      if (!emailRegex.test(email)) {
        console.log('Email inválido:', email);
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }
      const domain = email.split('@')[1].toLowerCase();
      const tld = domain.split('.').slice(-2).join('.');
      const tldSimple = domain.split('.').pop();
      if (!validTlds.includes(tld) && !validTlds.includes(tldSimple)) {
        console.log('TLD inválido:', domain);
        return res.status(400).json({
          success: false,
          message: 'Domínio de e-mail inválido'
        });
      }

      // Padronizar telefone para só números
      let telefoneNumeros = telefone.replace(/\D/g, '');
      if (!/^\d{10,11}$/.test(telefoneNumeros)) {
        console.log('Telefone inválido:', telefone, '->', telefoneNumeros);
        return res.status(400).json({
          success: false,
          message: 'Telefone inválido. Use o formato (99) 99999-9999'
        });
      }

      console.log('Verificando se CPF já existe...');
      // Verificar se CPF já existe
      const existingCpf = await db.oneOrNone('SELECT cpf FROM Usuario WHERE cpf = $1', [cpf]);
      if (existingCpf) {
        console.log('CPF já existe:', cpf);
        return res.status(409).json({
          success: false,
          message: 'CPF já cadastrado'
        });
      }

      console.log('Verificando se email já existe...');
      // Verificar se email já existe
      const existingEmail = await db.oneOrNone('SELECT email FROM Usuario WHERE email = $1', [email]);
      if (existingEmail) {
        console.log('Email já existe:', email);
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado'
        });
      }

      console.log('Verificando se telefone já existe...');
      // Verificar se telefone já existe
      const existingTelefone = await db.oneOrNone('SELECT telefone FROM Usuario WHERE telefone = $1', [telefoneNumeros]);
      if (existingTelefone) {
        console.log('Telefone já existe:', telefoneNumeros);
        return res.status(409).json({
          success: false,
          message: 'Telefone já cadastrado'
        });
      }

      console.log('Gerando código do usuário...');
      // Gerar código automaticamente: USUxxx (incremental)
      const lastUser = await db.oneOrNone("SELECT codigo FROM Usuario WHERE codigo LIKE 'USU%' ORDER BY codigo DESC LIMIT 1");
      let nextNumber = 1;
      if (lastUser && lastUser.codigo) {
        const match = lastUser.codigo.match(/USU(\d+)/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }
      const codigo = `USU${String(nextNumber).padStart(3, '0')}`;
      console.log('Código gerado:', codigo);

      console.log('Criptografando senha...');
      // Criptografar senha
      const hashedSenha = await bcrypt.hash(senha, 10);
      console.log('Senha criptografada');

      console.log('Inserindo usuário no banco...');
      const query = `
        INSERT INTO Usuario (cpf, nome, funcao, senha, email, telefone, codigo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const novoUsuario = await db.one(query, [cpf, nome, funcao, hashedSenha, email, telefoneNumeros, codigo]);
      console.log('Usuário criado com sucesso:', novoUsuario.cpf);

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        data: novoUsuario
      });

    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      console.error('Stack trace:', error.stack);
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
      
      // Log para debug
      console.log('Todos os usuários no banco:');
      usuarios.forEach(u => {
        console.log(`  - CPF: ${u.cpf}, Nome: ${u.nome}, Função: ${u.funcao}`);
      });
      
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

  // Endpoint de debug para verificar usuário específico
  async debugUser(req, res) {
    try {
      const { cpf } = req.params;
      console.log('DEBUG: Verificando usuário com CPF:', cpf);
      
      // Verificar se existe no banco
      const usuario = await db.oneOrNone('SELECT * FROM Usuario WHERE cpf = $1', [cpf]);
      console.log('DEBUG: Usuário encontrado:', usuario);
      
      // Verificar todos os usuários
      const todosUsuarios = await db.any('SELECT cpf, nome FROM Usuario');
      console.log('DEBUG: Todos os usuários:', todosUsuarios);
      
      res.json({
        success: true,
        debug: {
          cpfBuscado: cpf,
          usuarioEncontrado: usuario,
          todosUsuarios: todosUsuarios
        }
      });
    } catch (error) {
      console.error('Erro no debug:', error);
      res.status(500).json({
        success: false,
        message: 'Erro no debug',
        error: error.message
      });
    }
  }

  // Buscar usuário por CPF
  async findOne(req, res) {
    try {
      let { cpf } = req.params;
      
      console.log('Buscando usuário com CPF:', cpf);
      
      // Remover formatação do CPF para busca
      const cpfLimpo = cpf.replace(/\D/g, '');
      console.log('CPF limpo:', cpfLimpo);
      
      // Buscar usuário diretamente no banco com CPF formatado ou não formatado
      const usuario = await db.oneOrNone(`
        SELECT * FROM Usuario 
        WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = $1
      `, [cpfLimpo]);

      console.log('Resultado da busca:', usuario);

      if (!usuario) {
        console.log(`Usuário não encontrado para CPF: ${cpf} (limpo: ${cpfLimpo})`);
        
        // Vamos verificar se existem usuários no banco
        const todosUsuarios = await db.any('SELECT cpf FROM Usuario');
        console.log('Todos os CPFs no banco:', todosUsuarios.map(u => u.cpf));
        
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      console.log('Usuário encontrado:', usuario.cpf);
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
      let { cpf } = req.params;
      const { nome, funcao, senha, email, telefone, codigo } = req.body;

      // Remover formatação do CPF para busca
      const cpfLimpo = cpf.replace(/\D/g, '');

      // Verificar se usuário existe usando a mesma lógica do findOne
      const existingUsuario = await db.oneOrNone(`
        SELECT * FROM Usuario 
        WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = $1
      `, [cpfLimpo]);
      if (!existingUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Validações
      if (!nome || !funcao || !email || !telefone || !codigo) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Função só pode ser Administrador, Mecânico ou Secretária
      const funcoesPermitidas = ['Administrador', 'Mecânico', 'Secretária'];
      if (!funcoesPermitidas.includes(funcao)) {
        return res.status(400).json({
          success: false,
          message: 'Função inválida. Só é permitido Administrador, Mecânico ou Secretária.'
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
      const existingEmail = await db.oneOrNone('SELECT email FROM Usuario WHERE email = $1 AND cpf != $2', [email, existingUsuario.cpf]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado por outro usuário'
        });
      }

      // Verificar se telefone já existe (exceto para o usuário atual)
      const telefoneNumeros = telefone.replace(/\D/g, '');
      const existingTelefone = await db.oneOrNone('SELECT telefone FROM Usuario WHERE telefone = $1 AND cpf != $2', [telefoneNumeros, existingUsuario.cpf]);
      if (existingTelefone) {
        return res.status(409).json({
          success: false,
          message: 'Telefone já cadastrado por outro usuário'
        });
      }

      // Verificar se código já existe (exceto para o usuário atual)
      const existingCodigo = await db.oneOrNone('SELECT codigo FROM Usuario WHERE codigo = $1 AND cpf != $2', [codigo, existingUsuario.cpf]);
      if (existingCodigo) {
        return res.status(409).json({
          success: false,
          message: 'Código já cadastrado por outro usuário'
        });
      }

      // Decidir se vai atualizar a senha ou manter a atual
      let senhaFinal = existingUsuario.senha; // Manter senha atual por padrão
      if (senha && senha !== 'manter_atual') {
        senhaFinal = await bcrypt.hash(senha, 10); // Criptografar nova senha
      }

      const query = `
        UPDATE Usuario 
        SET nome = $1, funcao = $2, senha = $3, email = $4, telefone = $5, codigo = $6
        WHERE cpf = $7
        RETURNING *
      `;

      const usuarioAtualizado = await db.one(query, [nome, funcao, senhaFinal, email, telefoneNumeros, codigo, existingUsuario.cpf]);

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
      let { cpf } = req.params;

      // Remover formatação do CPF para busca
      const cpfLimpo = cpf.replace(/\D/g, '');

      // Verificar se usuário existe usando a mesma lógica do findOne
      const existingUsuario = await db.oneOrNone(`
        SELECT * FROM Usuario 
        WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = $1
      `, [cpfLimpo]);
      if (!existingUsuario) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      // Verificar se há ordens de serviço vinculadas
      const ordensVinculadas = await db.oneOrNone('SELECT cod FROM Ordem_de_servico WHERE usuario_cpf = $1', [existingUsuario.cpf]);
      if (ordensVinculadas) {
        return res.status(400).json({
          success: false,
          message: 'Não é possível remover usuário que possui ordens de serviço vinculadas'
        });
      }

      await db.none('DELETE FROM Usuario WHERE cpf = $1', [existingUsuario.cpf]);

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

  // Login de usuário
  async login(req, res) {
    try {
      const { email, senha } = req.body;
      if (!email || !senha) {
        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios'
        });
      }
      // Buscar usuário pelo email
      const usuario = await db.oneOrNone('SELECT * FROM Usuario WHERE email = $1', [email]);
      if (!usuario) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }
      // Verificar senha
      const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
      if (!senhaCorreta) {
        return res.status(401).json({
          success: false,
          message: 'Senha incorreta'
        });
      }
      // Gerar JWT
      const token = jwt.sign(
        { cpf: usuario.cpf, role: usuario.funcao },
        process.env.JWT_SECRET,
        { expiresIn: '2h' }
      );
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token,
        role: usuario.funcao,
        nome: usuario.nome
      });
    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }

  // Listar todos os mecânicos
  async findMecanicos(req, res) {
    try {
      const mecanicos = await db.any("SELECT cpf, nome FROM Usuario WHERE funcao = 'Mecânico'");
      res.json({ success: true, data: mecanicos });
    } catch (error) {
      console.error('Erro ao listar mecânicos:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor', error: error.message });
    }
  }
}

// Middleware de autorização por função
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Acesso negado' });
      }
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Token inválido' });
    }
  };
}

module.exports = new UsuarioApiController();
module.exports.authorizeRoles = authorizeRoles; 