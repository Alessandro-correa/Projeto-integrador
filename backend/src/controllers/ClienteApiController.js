const db = require('../config/database');

class ClienteApiController {
  // Criar cliente
  async create(req, res) {
    try {
      const { cpf, nome, sexo, endereco, telefone: telefoneOriginal, email, profissao, dataDeNascimento } = req.body;

      // Validações
      if (!cpf || !nome || !sexo || !endereco || !telefoneOriginal || !email || !profissao || !dataDeNascimento) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // formato do CPF
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (!cpfRegex.test(cpf)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de CPF inválido. Use o formato: XXX.XXX.XXX-XX'
        });
      }

      // formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z.]{2,}$/;
      const validTlds = [
        'com', 'net', 'org', 'edu', 'gov', 'mil', 'br',
        'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br'
      ];
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }
      const domain = email.split('@')[1].toLowerCase();
      const tld = domain.split('.').slice(-2).join('.');
      const tldSimple = domain.split('.').pop();
      if (!validTlds.includes(tld) && !validTlds.includes(tldSimple)) {
        return res.status(400).json({
          success: false,
          message: 'Domínio de e-mail inválido'
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

      // Validar ano (ex: entre 1920 e ano atual - 10 anos)
      const anoAtual = new Date().getFullYear();
      const anoNasc = dataNasc.getFullYear();
      if (anoNasc < 1920 || anoNasc > (anoAtual - 10)) {
        return res.status(400).json({
          success: false,
          message: 'Ano de nascimento inválido. Use um ano entre 1920 e ' + (anoAtual - 10)
        });
      }

      // Padronizar telefone para só números
      let telefone = telefoneOriginal.replace(/\D/g, '');
      if (!/^\d{10,11}$/.test(telefone)) {
        return res.status(400).json({
          success: false,
          message: 'Telefone inválido. Deve conter DDD + número: (99) 9999-9999 ou (99) 99999-9999'
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
      if (error.code === '23505') {
        if (error.detail && error.detail.includes('telefone')) {
          return res.status(409).json({
            success: false,
            message: 'Telefone já cadastrado'
          });
        }
        if (error.detail && error.detail.includes('email')) {
          return res.status(409).json({
            success: false,
            message: 'Email já cadastrado'
          });
        }
        if (error.detail && error.detail.includes('cpf')) {
          return res.status(409).json({
            success: false,
            message: 'CPF já cadastrado'
          });
        }
      }
      console.error('Erro ao criar cliente:', error, JSON.stringify(error));
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
      let { cpf } = req.params;
      
      // Remover formatação do CPF para busca
      const cpfLimpo = cpf.replace(/\D/g, '');
      
      // Buscar cliente diretamente no banco com CPF formatado ou não formatado
      const cliente = await db.oneOrNone(`
        SELECT * FROM Cliente 
        WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = $1
      `, [cpfLimpo]);

      if (!cliente) {
        console.log(`Cliente não encontrado para CPF: ${cpf} (limpo: ${cpfLimpo})`);
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
      let { cpf } = req.params;
      const { nome, sexo, endereco, telefone: telefoneOriginal, email, profissao, data_de_nascimento } = req.body;

      // Remover formatação do CPF para busca
      const cpfLimpo = cpf.replace(/\D/g, '');

      // Validações
      if (!nome || !sexo || !endereco || !telefoneOriginal || !email || !profissao || !data_de_nascimento) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios'
        });
      }

      // Verificar se cliente existe usando a mesma lógica do findOne
      const existingCliente = await db.oneOrNone(`
        SELECT * FROM Cliente 
        WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = $1
      `, [cpfLimpo]);
      if (!existingCliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente não encontrado'
        });
      }

      // Validar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z.]{2,}$/;
      const validTlds = [
        'com', 'net', 'org', 'edu', 'gov', 'mil', 'br',
        'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br'
      ];
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }
      const domain = email.split('@')[1].toLowerCase();
      const tld = domain.split('.').slice(-2).join('.');
      const tldSimple = domain.split('.').pop();
      if (!validTlds.includes(tld) && !validTlds.includes(tldSimple)) {
        return res.status(400).json({
          success: false,
          message: 'Domínio de e-mail inválido'
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
      const dataNasc = new Date(data_de_nascimento);
      if (isNaN(dataNasc.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Data de nascimento inválida'
        });
      }

      // Validar ano (ex: entre 1920 e ano atual - 10 anos)
      const anoAtual = new Date().getFullYear();
      const anoNasc = dataNasc.getFullYear();
      if (anoNasc < 1920 || anoNasc > (anoAtual - 10)) {
        return res.status(400).json({
          success: false,
          message: 'Ano de nascimento inválido. Use um ano entre 1920 e ' + (anoAtual - 10)
        });
      }

      // Padronizar telefone para só números
      let telefone = telefoneOriginal.replace(/\D/g, '');
      if (!/^\d{10,11}$/.test(telefone)) {
        return res.status(400).json({
          success: false,
          message: 'Telefone inválido. Deve conter DDD + número: (99) 9999-9999 ou (99) 99999-9999'
        });
      }

      // Verificar se email já existe (mas não para este cliente)
      const existingEmail = await db.oneOrNone('SELECT email FROM Cliente WHERE email = $1 AND cpf != $2', [email, existingCliente.cpf]);
      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email já cadastrado para outro cliente'
        });
      }

      // Atualizar cliente usando o CPF do banco de dados
      await db.none(`
        UPDATE Cliente 
        SET nome = $1, sexo = $2, endereco = $3, telefone = $4, email = $5, profissao = $6, data_de_nascimento = $7
        WHERE cpf = $8
      `, [nome, sexo, endereco, telefone, email, profissao, data_de_nascimento, existingCliente.cpf]);

      res.json({
        success: true,
        message: 'Cliente atualizado com sucesso'
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

  // Verificar se email já existe
  async checkEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório'
        });
      }

      const existingEmail = await db.oneOrNone('SELECT email FROM Cliente WHERE email = $1', [email]);
      
      res.json({
        success: true,
        exists: !!existingEmail
      });

    } catch (error) {
      console.error('Erro ao verificar email:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new ClienteApiController();