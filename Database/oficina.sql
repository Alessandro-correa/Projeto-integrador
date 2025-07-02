CREATE DATABASE oficina;

\c oficina;

CREATE TABLE IF NOT EXISTS Usuario (
    Cpf VARCHAR(14) PRIMARY KEY,
    Nome VARCHAR(100) NOT NULL,
    Funcao VARCHAR(50) NOT NULL,
    Senha VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Telefone VARCHAR(15) NOT NULL UNIQUE,
    Codigo VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Cliente (
    Cpf VARCHAR(14) PRIMARY KEY,
    Nome VARCHAR(50) NOT NULL,
    Sexo VARCHAR(10) NOT NULL,
    Endereco TEXT NOT NULL,
    Telefone VARCHAR(20) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Profissao VARCHAR(50) NOT NULL,
    Data_de_nascimento DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS Ordem_de_servico (
    Cod SERIAL PRIMARY KEY,
    Titulo VARCHAR(50) NOT NULL,
    Data DATE NOT NULL,
    Descricao TEXT NOT NULL,
    Status VARCHAR(50) NOT NULL,
    Observacao TEXT,
    Validada BOOLEAN DEFAULT FALSE,
    Usuario_CPF VARCHAR(14) NOT NULL,
    FOREIGN KEY (Usuario_CPF) REFERENCES Usuario(Cpf)
);

CREATE TABLE IF NOT EXISTS Orcamento (
    Id SERIAL PRIMARY KEY,
    Valor DECIMAL(10,2) NOT NULL,
    Validade DATE NOT NULL,
    Ordem_servico_COD INT NOT NULL,
    Cliente_CPF VARCHAR(14) NOT NULL,
    FOREIGN KEY (Ordem_servico_COD) REFERENCES Ordem_de_servico(Cod),
    FOREIGN KEY (Cliente_CPF) REFERENCES Cliente(Cpf)
);

CREATE TABLE IF NOT EXISTS Motocicleta (
    Placa VARCHAR(8) PRIMARY KEY,
    Ano INT NOT NULL,
    Cor VARCHAR(20) NOT NULL,
    Modelo VARCHAR(50) NOT NULL,
    Cilindrada INT NOT NULL,
    Cliente_CPF VARCHAR(14) NOT NULL,
    Ordem_de_servico_COD INT,
    FOREIGN KEY (Cliente_CPF) REFERENCES Cliente(Cpf),
    FOREIGN KEY (Ordem_de_servico_COD) REFERENCES Ordem_de_servico(Cod)
);

CREATE TABLE IF NOT EXISTS Marca (
    Id SERIAL PRIMARY KEY,
    Nome VARCHAR(50) NOT NULL,
    Motocicleta_placa VARCHAR(8) UNIQUE,
    FOREIGN KEY (Motocicleta_placa) REFERENCES Motocicleta(Placa)
);

CREATE TABLE IF NOT EXISTS Possui (
    Cliente_Cpf VARCHAR(14),
    Motocicleta_placa VARCHAR(8),
    PRIMARY KEY (Cliente_Cpf, Motocicleta_placa),
    FOREIGN KEY (Cliente_Cpf) REFERENCES Cliente(Cpf),
    FOREIGN KEY (Motocicleta_placa) REFERENCES Motocicleta(Placa)
);

CREATE TABLE IF NOT EXISTS Aquisicao (
    Id SERIAL PRIMARY KEY,
    Dia_da_compra DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS Peca (
    Id SERIAL PRIMARY KEY,
    Descricao VARCHAR(100) NOT NULL,
    Nome VARCHAR(50) NOT NULL,
    Valor DECIMAL(10,2) NOT NULL,
    Aquisicao_ID INT NOT NULL,
    Preco_da_compra DECIMAL(10,2) NOT NULL,
    Vencimento DATE,
    Quantidade INT NOT NULL,
    FOREIGN KEY (Aquisicao_ID) REFERENCES Aquisicao(Id)
);

CREATE TABLE IF NOT EXISTS Fornecedor (
    Id SERIAL PRIMARY KEY,
    CNPJ VARCHAR(18) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Endereco VARCHAR(100) NOT NULL,
    Nome VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Fornece (
    Peca_ID INT,
    Fornecedor_ID INT,
    PRIMARY KEY (Peca_ID, Fornecedor_ID),
    FOREIGN KEY (Peca_ID) REFERENCES Peca(Id),
    FOREIGN KEY (Fornecedor_ID) REFERENCES Fornecedor(Id)
);

CREATE TABLE IF NOT EXISTS Possui_peca (
    Ordem_de_servico_COD INT,
    Peca_ID INT,
    Qtd_pecas INT NOT NULL CHECK (Qtd_pecas > 0),
    PRIMARY KEY (Ordem_de_servico_COD, Peca_ID),
    FOREIGN KEY (Ordem_de_servico_COD) REFERENCES Ordem_de_servico(Cod),
    FOREIGN KEY (Peca_ID) REFERENCES Peca(Id)
);

SET datestyle = 'ISO, DMY';

-- Usuários
INSERT INTO Usuario (Cpf, Nome, Funcao, Senha, Email, Telefone, Codigo) 
VALUES
('123.456.789-00', 'Carlos Souza', 'Mecânico', 'senha123', 'carlos@oficina.com', '99999-0001', 'USR001'),
('321.654.987-00', 'Juliana Alves', 'Atendente', 'senha456', 'juliana@oficina.com', '99999-0002', 'USR002');

-- Clientes
INSERT INTO Cliente (Cpf, Nome, Sexo, Endereco, Telefone, Email, Profissao, Data_de_nascimento)
VALUES
('111.222.333-44', 'Ana Silva', 'Feminino', 'Rua das Flores, 123', '98888-0002', 'ana.silva@email.com', 'Engenheira', '15/04/1990'),
('555.666.777-88', 'Bruno Lima', 'Masculino', 'Av. Brasil, 456', '97777-0003', 'bruno.lima@email.com', 'Mecânico', '20/08/1985');

-- Ordem de Serviço
INSERT INTO Ordem_de_servico (Titulo, Data, Descricao, Status, Observacao, Validada, Usuario_CPF) 
VALUES
('Revisão Completa', '01/07/2025', 'Troca de óleo, freios e limpeza geral', 'Em andamento', 'Solicitou urgência', TRUE, '123.456.789-00'),
('Troca de pneus', '02/07/2025', 'Substituição dos pneus traseiros', 'Pendente', NULL, FALSE, '321.654.987-00');

-- Orçamentos
INSERT INTO Orcamento (Valor, Validade, Ordem_servico_COD, Cliente_CPF) 
VALUES
(850.00, '15/07/2025', 1, '111.222.333-44'),
(450.00, '18/07/2025', 2, '555.666.777-88');

-- Motocicletas
INSERT INTO Motocicleta (Placa, Ano, Cor, Modelo, Cilindrada, Cliente_CPF, Ordem_de_servico_COD) 
VALUES
('ABC1234', 2022, 'Preta', 'Honda CB500', 500, '111.222.333-44', 1),
('XYZ5678', 2020, 'Vermelha', 'Yamaha MT-03', 300, '555.666.777-88', 2);

-- Marca
INSERT INTO Marca (Nome, Motocicleta_placa) 
VALUES
('Honda', 'ABC1234'),
('Yamaha', 'XYZ5678');

-- Relação Cliente-Moto
INSERT INTO Possui (Cliente_Cpf, Motocicleta_placa) 
VALUES
('111.222.333-44', 'ABC1234'),
('555.666.777-88', 'XYZ5678');

-- Aquisicoes
INSERT INTO Aquisicao (Dia_da_compra) 
VALUES
('25/06/2025'),
('28/06/2025');

-- Peças
INSERT INTO Peca (Descricao, Nome, Valor, Aquisicao_ID, Preco_da_compra, Vencimento, Quantidade) 
VALUES
('Filtro de óleo original Honda', 'Filtro de óleo', 50.00, 1, 30.00, '01/12/2025', 20),
('Pneu traseiro esportivo', 'Pneu traseiro', 300.00, 2, 200.00, NULL, 5);

-- Fornecedores
INSERT INTO Fornecedor (CNPJ, Email, Endereco, Nome) 
VALUES
('12.345.678/0001-90', 'vendas@pecas.com', 'Av. Autopeças, 789', 'Auto Peças Brasil'),
('98.765.432/0001-12', 'contato@motoparts.com', 'Rua das Motos, 987', 'MotoParts');

-- Fornece
INSERT INTO Fornece (Peca_ID, Fornecedor_ID) 
VALUES
(1, 1),
(2, 2);

-- Peças utilizadas nas ordens
INSERT INTO Possui_peca (Ordem_de_servico_COD, Peca_ID, Qtd_pecas) 
VALUES
(1, 1, 1),
(2, 2, 1);
