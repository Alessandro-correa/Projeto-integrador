-- Criação do banco e seleção
CREATE DATABASE IF NOT EXISTS oficina;
\c oficina;

-- Ajustes de formato de data e codificação
SET datestyle = 'ISO, DMY';
SET client_encoding = 'UTF8';

-- Tabelas

CREATE TABLE IF NOT EXISTS Usuario (
    Cpf       VARCHAR(14) PRIMARY KEY,
    Nome      VARCHAR(100) NOT NULL,
    Funcao    VARCHAR(50) NOT NULL,
    Senha     VARCHAR(100) NOT NULL,
    Email     VARCHAR(100) NOT NULL UNIQUE,
    Telefone  VARCHAR(15) NOT NULL UNIQUE,
    Codigo    VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS Cliente (
    Cpf                VARCHAR(14) PRIMARY KEY,
    Nome               VARCHAR(50)  NOT NULL,
    Sexo               VARCHAR(10)  NOT NULL,
    Endereco           TEXT         NOT NULL,
    Telefone           VARCHAR(20)  NOT NULL,
    Email              VARCHAR(100) NOT NULL UNIQUE,
    Profissao          VARCHAR(50)  NOT NULL,
    Data_de_nascimento DATE         NOT NULL
);

CREATE TABLE IF NOT EXISTS Motocicleta (
    Placa       VARCHAR(8)  PRIMARY KEY,
    Ano         INT         NOT NULL,
    Cor         VARCHAR(20) NOT NULL,
    Modelo      VARCHAR(50) NOT NULL,
    Cilindrada  INT         NOT NULL,
    Cliente_CPF VARCHAR(14) NOT NULL,
    FOREIGN KEY (Cliente_CPF) REFERENCES Cliente(Cpf)
);

CREATE TABLE IF NOT EXISTS Ordem_de_servico (
    Cod               SERIAL      PRIMARY KEY,
    Titulo            VARCHAR(50) NOT NULL,
    Data              DATE        NOT NULL,
    Descricao         TEXT        NOT NULL,
    Status            VARCHAR(50) NOT NULL,
    Observacao        TEXT,
    Valor             DECIMAL(10,2) DEFAULT 0.00,
    Valor_mao_de_obra DECIMAL(10,2) DEFAULT 0.00,
    Validada          BOOLEAN     DEFAULT FALSE,
    Usuario_CPF       VARCHAR(14) NOT NULL,
    Cliente_CPF       VARCHAR(14) NOT NULL,
    Motocicleta_placa VARCHAR(8)  NOT NULL,
    FOREIGN KEY (Usuario_CPF)       REFERENCES Usuario(Cpf),
    FOREIGN KEY (Cliente_CPF)       REFERENCES Cliente(Cpf),
    FOREIGN KEY (Motocicleta_placa) REFERENCES Motocicleta(Placa)
);

CREATE TABLE IF NOT EXISTS Orcamento (
    Id                 SERIAL      PRIMARY KEY,
    Valor              DECIMAL(10,2) NOT NULL,
    Validade           DATE        NOT NULL,
    Status             VARCHAR(2)  DEFAULT 'P' CHECK (Status IN ('P', 'A', 'R')), -- P=Pendente, A=Aprovado, R=Rejeitado
    Descricao          TEXT,
    Ordem_servico_COD  INT,
    Cliente_CPF        VARCHAR(14) NOT NULL,
    FOREIGN KEY (Ordem_servico_COD) REFERENCES Ordem_de_servico(Cod),
    FOREIGN KEY (Cliente_CPF)         REFERENCES Cliente(Cpf)
);

CREATE TABLE IF NOT EXISTS Marca (
    Id                 SERIAL      PRIMARY KEY,
    Nome               VARCHAR(50) NOT NULL,
    Motocicleta_placa  VARCHAR(8)  UNIQUE,
    FOREIGN KEY (Motocicleta_placa) REFERENCES Motocicleta(Placa)
);

CREATE TABLE IF NOT EXISTS Possui (
    Cliente_Cpf        VARCHAR(14),
    Motocicleta_placa  VARCHAR(8),
    PRIMARY KEY (Cliente_Cpf, Motocicleta_placa),
    FOREIGN KEY (Cliente_Cpf)       REFERENCES Cliente(Cpf),
    FOREIGN KEY (Motocicleta_placa) REFERENCES Motocicleta(Placa)
);

CREATE TABLE IF NOT EXISTS Aquisicao (
    Id            SERIAL PRIMARY KEY,
    Dia_da_compra DATE   NOT NULL
);

CREATE TABLE IF NOT EXISTS Peca (
    Id        SERIAL      PRIMARY KEY,
    Descricao VARCHAR(100) NOT NULL,
    Nome      VARCHAR(50)  NOT NULL,
    Valor     DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS Aquisicao_Produto (
    Aquisicao_ID    INT  NOT NULL,
    Peca_ID         INT  NOT NULL,
    Preco_da_compra DECIMAL(10,2) NOT NULL,
    Vencimento      DATE,
    Quantidade      INT  NOT NULL CHECK (Quantidade > 0),
    PRIMARY KEY (Aquisicao_ID, Peca_ID),
    FOREIGN KEY (Aquisicao_ID) REFERENCES Aquisicao(Id),
    FOREIGN KEY (Peca_ID)      REFERENCES Peca(Id)
);

CREATE TABLE IF NOT EXISTS Fornecedor (
    Id       SERIAL      PRIMARY KEY,
    CNPJ     VARCHAR(18) NOT NULL UNIQUE,
    Email    VARCHAR(100) NOT NULL UNIQUE,
    Endereco VARCHAR(100) NOT NULL,
    Nome     VARCHAR(50)  NOT NULL
);

CREATE TABLE IF NOT EXISTS Fornece (
    Peca_ID       INT,
    Fornecedor_ID INT,
    PRIMARY KEY (Peca_ID, Fornecedor_ID),
    FOREIGN KEY (Peca_ID)       REFERENCES Peca(Id),
    FOREIGN KEY (Fornecedor_ID) REFERENCES Fornecedor(Id)
);

CREATE TABLE IF NOT EXISTS Possui_peca (
    Ordem_de_servico_COD INT,
    Peca_ID              INT,
    Qtd_pecas            INT NOT NULL CHECK (Qtd_pecas > 0),
    PRIMARY KEY (Ordem_de_servico_COD, Peca_ID),
    FOREIGN KEY (Ordem_de_servico_COD) REFERENCES Ordem_de_servico(Cod),
    FOREIGN KEY (Peca_ID)                  REFERENCES Peca(Id)
);

-- Inserts de dados

-- 👨‍💼 USUÁRIOS (3 tipos: Secretária, Mecânico, Administrador)
INSERT INTO Usuario (Cpf, Nome, Funcao, Senha, Email, Telefone, Codigo) 
VALUES
  ('111.111.111-11', 'Maria Fernanda', 'Secretária', 'senha123', 'maria.secretaria@oficina.com', '11999-0001', 'SEC001'),
  ('222.222.222-22', 'João Carlos', 'Mecânico', 'senha456', 'joao.mecanico@oficina.com', '11999-0002', 'MEC001'),
  ('333.333.333-33', 'Roberto Silva', 'Administrador', 'senha789', 'roberto.admin@oficina.com', '11999-0003', 'ADM001');

-- 👥 CLIENTES (10 exemplos)
INSERT INTO Cliente (Cpf, Nome, Sexo, Endereco, Telefone, Email, Profissao, Data_de_nascimento)
VALUES
  ('100.200.300-01', 'Ana Paula Santos', 'Feminino', 'Rua das Flores, 123 - Centro', '11998-1001', 'ana.santos@email.com', 'Engenheira', '1990-04-15'),
  ('100.200.300-02', 'Bruno Oliveira', 'Masculino', 'Av. Brasil, 456 - Vila Nova', '11998-1002', 'bruno.oliveira@email.com', 'Professor', '1985-08-22'),
  ('100.200.300-03', 'Carla Ferreira', 'Feminino', 'Rua Palmeiras, 789 - Jardim', '11998-1003', 'carla.ferreira@email.com', 'Médica', '1992-11-10'),
  ('100.200.300-04', 'Diego Martins', 'Masculino', 'Av. Paulista, 1000 - Centro', '11998-1004', 'diego.martins@email.com', 'Advogado', '1988-06-18'),
  ('100.200.300-05', 'Elena Costa', 'Feminino', 'Rua Verde, 250 - Parque', '11998-1005', 'elena.costa@email.com', 'Arquiteta', '1995-01-25'),
  ('100.200.300-06', 'Fernando Lima', 'Masculino', 'Av. Central, 333 - Vila', '11998-1006', 'fernando.lima@email.com', 'Empresário', '1982-12-03'),
  ('100.200.300-07', 'Gabriela Rocha', 'Feminino', 'Rua Azul, 567 - Bairro Novo', '11998-1007', 'gabriela.rocha@email.com', 'Designer', '1993-09-14'),
  ('100.200.300-08', 'Henrique Alves', 'Masculino', 'Av. Industrial, 890 - Zona Sul', '11998-1008', 'henrique.alves@email.com', 'Engenheiro', '1987-07-08'),
  ('100.200.300-09', 'Isabela Nunes', 'Feminino', 'Rua Solar, 445 - Residencial', '11998-1009', 'isabela.nunes@email.com', 'Psicóloga', '1991-03-30'),
  ('100.200.300-10', 'João Pedro Silva', 'Masculino', 'Av. Liberdade, 678 - Centro', '11998-1010', 'joao.silva@email.com', 'Contador', '1989-05-12');

-- 🏍️ MOTOCICLETAS (10 exemplos)
INSERT INTO Motocicleta (Placa, Ano, Cor, Modelo, Cilindrada, Cliente_CPF) 
VALUES
  ('ABC1234', 2022, 'Preta', 'Honda CB 500X', 500, '100.200.300-01'),
  ('DEF5678', 2021, 'Vermelha', 'Yamaha MT-03', 300, '100.200.300-02'),
  ('GHI9012', 2023, 'Azul', 'Honda CG 160 Titan', 160, '100.200.300-03'),
  ('JKL3456', 2020, 'Branca', 'Kawasaki Ninja 400', 400, '100.200.300-04'),
  ('MNO7890', 2022, 'Verde', 'Yamaha Fazer 250', 250, '100.200.300-05'),
  ('PQR1234', 2021, 'Prata', 'Honda PCX 150', 150, '100.200.300-06'),
  ('STU5678', 2023, 'Amarela', 'Suzuki GSX-S750', 750, '100.200.300-07'),
  ('VWX9012', 2020, 'Roxa', 'BMW G 310 R', 310, '100.200.300-08'),
  ('YZA3456', 2022, 'Laranja', 'KTM Duke 390', 390, '100.200.300-09'),
  ('BCD7890', 2021, 'Cinza', 'Triumph Street Triple', 675, '100.200.300-10');

-- 🔧 ORDENS DE SERVIÇO (10 exemplos - distribuídos ao longo do ano)
INSERT INTO Ordem_de_servico (Titulo, Data, Descricao, Status, Observacao, Valor, Valor_mao_de_obra, Validada, Usuario_CPF, Cliente_CPF, Motocicleta_placa)
VALUES
  ('Revisão Completa', '2025-01-15', 'Troca de óleo, filtros, velas e revisão geral', 'Validada', 'Cliente solicitou urgência', 850.00, 350.00, TRUE, '222.222.222-22', '100.200.300-01', 'ABC1234'),
  ('Troca de Pneus', '2025-02-20', 'Substituição dos pneus dianteiro e traseiro', 'Validada', 'Pneus substituídos com sucesso', 450.00, 100.00, TRUE, '222.222.222-22', '100.200.300-02', 'DEF5678'),
  ('Reparo de Freios', '2025-03-10', 'Troca de pastilhas e fluido de freio', 'Validada', 'Serviço concluído com sucesso', 320.00, 150.00, TRUE, '222.222.222-22', '100.200.300-03', 'GHI9012'),
  ('Manutenção Preventiva', '2025-05-05', 'Lubrificação da corrente e ajustes gerais', 'Validada', 'Manutenção preventiva concluída', 180.00, 120.00, TRUE, '222.222.222-22', '100.200.300-04', 'JKL3456'),
  ('Troca de Bateria', '2025-05-12', 'Substituição da bateria e teste elétrico', 'Validada', 'Bateria com defeito substituída', 280.00, 80.00, TRUE, '222.222.222-22', '100.200.300-05', 'MNO7890'),
  ('Reparo de Suspensão', '2025-06-18', 'Regulagem e troca de componentes da suspensão', 'Validada', 'Suspensão ajustada perfeitamente', 750.00, 200.00, TRUE, '222.222.222-22', '100.200.300-06', 'PQR1234'),
  ('Limpeza e Enceramento', '2025-07-08', 'Lavagem completa e aplicação de cera protetiva', 'Em Andamento', 'Em processo de finalização', 120.00, 120.00, FALSE, '222.222.222-22', '100.200.300-07', 'STU5678'),
  ('Troca de Corrente', '2025-07-14', 'Substituição de corrente e coroas', 'Validação Pendente', 'Aguardando validação do mecânico', 650.00, 200.00, FALSE, '222.222.222-22', '100.200.300-08', 'VWX9012'),
  ('Revisão de Motor', '2025-05-14', 'Análise completa do motor e ajustes', 'Ajuste Pendente', 'Motor com ruído anormal - ajustes necessários', 1200.00, 600.00, FALSE, '222.222.222-22', '100.200.300-09', 'YZA3456'),
  ('Instalação de Acessórios', '2025-06-30', 'Instalação de baú, protetor de motor e farol auxiliar', 'Rejeitada', 'Cliente cancelou o serviço', 380.00, 180.00, FALSE, '222.222.222-22', '100.200.300-10', 'BCD7890');

-- 💰 ORÇAMENTOS (10 exemplos - com descrições detalhadas)
INSERT INTO Orcamento (Valor, Validade, Status, Descricao, Ordem_servico_COD, Cliente_CPF) 
VALUES
  (850.00, '2025-01-30', 'A', 'SERVIÇO: Troca de óleo do motor - R$ 150,00;SERVIÇO: Substituição de filtros (ar, óleo, combustível) - R$ 100,00;SERVIÇO: Troca de velas de ignição - R$ 100,00;PEÇA: Óleo motor 20W50 - Qtd: 4 - Valor unit: R$ 25,00;PEÇA: Filtro de óleo - Qtd: 1 - Valor unit: R$ 35,00;PEÇA: Filtro de ar - Qtd: 1 - Valor unit: R$ 45,00;PEÇA: Velas NGK - Qtd: 2 - Valor unit: R$ 95,00', 1, '100.200.300-01'),  -- Janeiro
  
  (450.00, '2025-03-05', 'A', 'SERVIÇO: Desmontagem e montagem dos pneus - R$ 100,00;PEÇA: Pneu dianteiro Pirelli - Qtd: 1 - Valor unit: R$ 180,00;PEÇA: Pneu traseiro Pirelli - Qtd: 1 - Valor unit: R$ 170,00', 2, '100.200.300-02'),  -- Fevereiro 
  
  (320.00, '2025-03-25', 'A', 'SERVIÇO: Troca de pastilhas de freio dianteiras - R$ 80,00;SERVIÇO: Sangria e troca do fluido de freio - R$ 70,00;PEÇA: Pastilhas de freio dianteiras - Qtd: 1 - Valor unit: R$ 85,00;PEÇA: Fluido de freio DOT 4 - Qtd: 1 - Valor unit: R$ 85,00', 3, '100.200.300-03'),  -- Março
  
  (180.00, '2025-04-20', 'A', 'SERVIÇO: Lubrificação da corrente e ajustes - R$ 60,00;SERVIÇO: Verificação e ajuste de cabos - R$ 60,00;PEÇA: Lubrificante para corrente - Qtd: 1 - Valor unit: R$ 30,00;PEÇA: Graxa para rolamentos - Qtd: 1 - Valor unit: R$ 30,00', 4, '100.200.300-04'),  -- Abril
  
  (280.00, '2025-05-28', 'A', 'SERVIÇO: Instalação e teste da nova bateria - R$ 80,00;PEÇA: Bateria Moura 12V 7Ah - Qtd: 1 - Valor unit: R$ 200,00', 5, '100.200.300-05'),  -- Maio
  
  (750.00, '2025-07-02', 'A', 'SERVIÇO: Regulagem da suspensão dianteira - R$ 100,00;SERVIÇO: Regulagem da suspensão traseira - R$ 100,00;PEÇA: Amortecedor dianteiro - Qtd: 2 - Valor unit: R$ 150,00;PEÇA: Amortecedor traseiro - Qtd: 2 - Valor unit: R$ 125,00', 6, '100.200.300-06'),  -- Junho
  
  (120.00, '2025-07-22', 'P', 'SERVIÇO: Lavagem completa da motocicleta - R$ 60,00;SERVIÇO: Aplicação de cera protetiva - R$ 60,00', NULL, '100.200.300-07'),  -- Julho (pendente, sem OS)
  
  (380.00, '2025-11-15', 'P', 'SERVIÇO: Instalação de baú traseiro - R$ 60,00;SERVIÇO: Instalação de protetor de motor - R$ 60,00;SERVIÇO: Instalação de farol auxiliar - R$ 60,00;PEÇA: Baú traseiro 35L - Qtd: 1 - Valor unit: R$ 120,00;PEÇA: Protetor de motor - Qtd: 1 - Valor unit: R$ 80,00', NULL, '100.200.300-10'); -- Outubro (pendente, sem OS)

-- 🏷️ MARCAS (10 exemplos)
INSERT INTO Marca (Nome, Motocicleta_placa) 
VALUES
  ('Honda', 'ABC1234'),
  ('Yamaha', 'DEF5678'),
  ('Honda', 'GHI9012'),
  ('Kawasaki', 'JKL3456'),
  ('Yamaha', 'MNO7890'),
  ('Honda', 'PQR1234'),
  ('Suzuki', 'STU5678'),
  ('BMW', 'VWX9012'),
  ('KTM', 'YZA3456'),
  ('Triumph', 'BCD7890');

-- 🔗 RELACIONAMENTO CLIENTE-MOTOCICLETA (10 exemplos)
INSERT INTO Possui (Cliente_Cpf, Motocicleta_placa) 
VALUES
  ('100.200.300-01', 'ABC1234'),
  ('100.200.300-02', 'DEF5678'),
  ('100.200.300-03', 'GHI9012'),
  ('100.200.300-04', 'JKL3456'),
  ('100.200.300-05', 'MNO7890'),
  ('100.200.300-06', 'PQR1234'),
  ('100.200.300-07', 'STU5678'),
  ('100.200.300-08', 'VWX9012'),
  ('100.200.300-09', 'YZA3456'),
  ('100.200.300-10', 'BCD7890');

-- 📦 AQUISIÇÕES (10 exemplos - distribuídas ao longo do ano)
INSERT INTO Aquisicao (Dia_da_compra) 
VALUES
  ('2024-12-15'),  -- Dezembro anterior
  ('2025-01-10'),  -- Janeiro
  ('2025-02-05'),  -- Fevereiro
  ('2025-03-20'),  -- Março
  ('2025-04-12'),  -- Abril
  ('2025-05-08'),  -- Maio
  ('2025-06-25'),  -- Junho
  ('2025-07-03'),  -- Julho
  ('2025-08-18'),  -- Agosto
  ('2025-09-22');  -- Setembro

-- 🔧 PEÇAS (10 exemplos)
INSERT INTO Peca (Descricao, Nome, Valor) 
VALUES
  ('Filtro de óleo original Honda para CB500', 'Filtro de Óleo Honda', 45.00),
  ('Pneu traseiro esportivo Michelin 180/55', 'Pneu Traseiro Michelin', 380.00),
  ('Pastilha de freio dianteira Brembo', 'Pastilha Freio Brembo', 120.00),
  ('Vela de ignição NGK Iridium', 'Vela NGK Iridium', 25.00),
  ('Corrente DID 520 com 120 elos', 'Corrente DID 520', 180.00),
  ('Bateria Moura 12V 8Ah selada', 'Bateria Moura 8Ah', 220.00),
  ('Óleo motor Motul 5100 15W50 semissintético', 'Óleo Motul 5100', 75.00),
  ('Amortecedor traseiro YSS regulável', 'Amortecedor YSS', 850.00),
  ('Pneu dianteiro Pirelli Diablo 120/70', 'Pneu Dianteiro Pirelli', 320.00),
  ('Kit relação completo Vaz', 'Kit Relação Vaz', 450.00);

-- 🛒 AQUISIÇÃO DE PRODUTOS (10 exemplos)
INSERT INTO Aquisicao_Produto (Aquisicao_ID, Peca_ID, Preco_da_compra, Vencimento, Quantidade)
VALUES
  (1, 1, 35.00, '2025-12-01', 50),
  (2, 2, 300.00, NULL, 20),
  (3, 3, 90.00, '2026-06-01', 30),
  (4, 4, 18.00, '2025-12-15', 100),
  (5, 5, 150.00, NULL, 25),
  (6, 6, 180.00, '2025-11-30', 15),
  (7, 7, 60.00, '2026-03-01', 80),
  (8, 8, 700.00, NULL, 10),
  (9, 9, 250.00, NULL, 18),
  (10, 10, 380.00, NULL, 12);

-- 🏭 FORNECEDORES (10 exemplos)
INSERT INTO Fornecedor (CNPJ, Email, Endereco, Nome) 
VALUES
  ('11.111.111/0001-11', 'vendas@hondapecas.com', 'Av. Honda, 1000 - São Paulo', 'Honda Peças Originais'),
  ('22.222.222/0002-22', 'contato@yamahapecas.com', 'Rua Yamaha, 500 - São Paulo', 'Yamaha Parts Brasil'),
  ('33.333.333/0003-33', 'pedidos@brembo.com.br', 'Av. Brembo, 300 - Campinas', 'Brembo Freios Brasil'),
  ('44.444.444/0004-44', 'vendas@michelin.com.br', 'Rua Michelin, 200 - Rio de Janeiro', 'Michelin Pneus'),
  ('55.555.555/0005-55', 'comercial@ngk.com.br', 'Av. NGK, 150 - Guarulhos', 'NGK Velas do Brasil'),
  ('66.666.666/0006-66', 'atendimento@motul.com.br', 'Rua Motul, 400 - São Bernardo', 'Motul Lubrificantes'),
  ('77.777.777/0007-77', 'vendas@pirelli.com.br', 'Av. Pirelli, 800 - Santo André', 'Pirelli Pneus Brasil'),
  ('88.888.888/0008-88', 'comercial@yss.com.br', 'Rua YSS, 250 - Sorocaba', 'YSS Suspensões'),
  ('99.999.999/0009-99', 'pedidos@moura.com.br', 'Av. Moura, 600 - Belo Horizonte', 'Moura Baterias'),
  ('10.101.010/0010-10', 'vendas@vaz.com.br', 'Rua Vaz, 350 - Curitiba', 'Vaz Transmissões');

-- 🤝 RELACIONAMENTO FORNECEDOR-PEÇA (10 exemplos)
INSERT INTO Fornece (Peca_ID, Fornecedor_ID) 
VALUES
  (1, 1),
  (2, 4),
  (3, 3),
  (4, 5),
  (5, 10),
  (6, 9),
  (7, 6),
  (8, 8),
  (9, 7),
  (10, 10);

-- 🔧 PEÇAS UTILIZADAS NAS ORDENS (10 exemplos)
INSERT INTO Possui_peca (Ordem_de_servico_COD, Peca_ID, Qtd_pecas) 
VALUES
  (1, 1, 1),  -- Revisão completa usa filtro de óleo
  (1, 7, 4),  -- Revisão completa usa óleo
  (2, 2, 1),  -- Troca de pneus usa pneu traseiro
  (2, 9, 1),  -- Troca de pneus usa pneu dianteiro
  (3, 3, 1),  -- Reparo de freios usa pastilha
  (4, 5, 1),  -- Manutenção usa corrente
  (5, 6, 1),  -- Troca de bateria
  (8, 5, 1),  -- Troca de corrente
  (8, 10, 1), -- Kit relação
  (10, 8, 1); -- Instalação de acessórios usa amortecedor
