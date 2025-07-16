# 📚 Projeto Integrador — 2025.1

## 👥 Equipe Responsável pelo Projeto

- *Alessandro Luigi Ferreira Correa* — 20230003860  
 [🔗 LinkedIn](https://www.linkedin.com/in/alessandro-corr%C3%AAa-644551223/)

- *Rhuan Lehmen de Souza Leite* — 20230001285  
 [🔗 LinkedIn](https://www.linkedin.com/in/rhuan-leite/)


Projeto integrador das disciplinas:

- Engenharia de Software I  
- Programação II  
- Banco de Dados I

---

## 📁 Estrutura

Toda a documentação do projeto está localizada na pasta **docs/**.

---

## Sistema de Gerenciamento de Oficina de Motocicletas 🏍🛠

### Descrição:
Este sistema foi desenvolvido para gerenciar as operações de uma oficina de motocicletas, abrangendo o controle de clientes, motocicletas, ordens de serviço, orçamentos, peças, fornecedores, marcas e usuários. O objetivo é otimizar o fluxo de trabalho, facilitar o acompanhamento dos serviços realizados.

O sistema conta com um painel de controle (dashboard) para visualização de dados, além de outras funcionalidades.

---

### *Tecnologias Utilizadas 📎*

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg" width="25" height="25"> Visual Studio Code:
IDE utilizada para o desenvolvimento do projeto.

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg" width="25" height="25" /> JavaScript:
Linguagem principal utilizada tanto no frontend quanto no backend.

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" width="25" height="25" /> Node.js:
Ambiente de execução JavaScript utilizado no backend para criação da API RESTful.

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" width="25" height="25" /> Express.js:
Framework web para Node.js, utilizado para estruturar as rotas e controlar as requisições do backend.

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original-wordmark.svg" width="25" height="25" /> HTML5:
Linguagem de marcação utilizada para estruturar as páginas do frontend.

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original-wordmark.svg" width="25" height="25" /> CSS3:
Utilizado para estilização das páginas, garantindo uma interface visual agradável e responsiva.

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" width="25" height="25" /> PostgreSQL:
Banco de dados relacional utilizado para armazenar todas as informações do sistema, como clientes, motos, ordens de serviço, peças, etc.

#### <img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mysql/mysql-original-wordmark.svg" width="25" height="25" /> SQL:
SQL (Structured Query Language) é uma linguagem utilizada para gerenciar e manipular bancos de dados relacionais, permitindo realizar operações como consultas, inserções, atualizações e exclusões de dados.

#### <img src="https://apexcharts.com/media/apexcharts-logo.png" width="25" height="25" /> ApexCharts:
Biblioteca JavaScript utilizada para criação de gráficos interativos no dashboard do sistema.

---

### 🔧 Pré-requisitos

Certifique-se de ter os seguintes itens instalados:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [PostgreSQL](https://www.postgresql.org/)

---

## Como executar o projeto

1. Inicialize o banco de dados:
   
   No terminal, execute:
   
   sh
   psql -U postgres -f Database/oficina.sql
   
   (Use o caminho completo se necessário e informe a senha do usuário do banco quando solicitado)

2. Acesse a pasta do backend:
   
   sh
   cd backend
   

3. Instale as dependências:
   
   sh
   npm install
   

4. Inicie o servidor:
   
   sh
   npm start
   