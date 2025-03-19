# Gerenciamento de Eventos com Emissão de Certificado

Este projeto é um sistema web completo para o gerenciamento de eventos, permitindo o cadastro de participantes e organizadores, divulgação dos eventos com informações detalhadas e emissão de bilhete digital. Além disso, para eventos que possuam a opção de certificado, o sistema libera a emissão do certificado em PDF após a realização do evento.

## Funcionalidades

- **Cadastro de Usuários:**  
  Permite o registro de participantes e organizadores de eventos.

- **Criação e Divulgação de Eventos:**  
  Os organizadores podem criar eventos com título, descrição, data, valor, quantidade de vagas, tipo (online ou presencial) e local.

- **Inscrição com Bilhete Digital:**  
  Participantes podem se inscrever nos eventos e, após a inscrição, recebem um bilhete digital (código do ticket) e um e-mail de confirmação.

- **Controle de Capacidade:**  
  O sistema impede que inscrições excedam a capacidade definida para o evento.

- **Emissão de Certificado:**  
  Após o término do evento, se estiver habilitada a opção de certificado, os participantes podem baixar um certificado de participação em PDF.

## Tecnologias Utilizadas

- **Backend:**  
  - Node.js com Express
  - Sequelize com SQLite
  - JSON Web Tokens (JWT) para autenticação
  - PDFKit para geração de certificados em PDF
  - Nodemailer para envio de e-mails

- **Frontend:**  
  - React
  - React Router
  - Axios para requisições HTTP
  - CSS para estilização

## Instalação e Execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) instalado
- [Git](https://git-scm.com/) instalado

### Backend

1. Navegue até a pasta do backend:
   ```bash
   cd caminho/do/projeto/backend

2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   node server.js
   ```
   O backend ficará disponível em `http://localhost:3001`.

### Frontend

1. Navegue até a pasta do frontend:
   ```bash
   cd caminho/do/projeto/frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie a aplicação:
   ```bash
   npm start
   ```
   O frontend ficará disponível em `http://localhost:3000`.

## API Endpoints

### Autenticação

- **Registro:**  
  `POST /api/register`  
  Corpo da requisição: `{ name, email, password, role }`

- **Login:**  
  `POST /api/login`  
  Corpo da requisição: `{ email, password }`

### Eventos

- **Listar Eventos:**  
  `GET /api/events`

- **Criar Evento (Organizadores):**  
  `POST /api/events`  
  Cabeçalho: `Authorization: Bearer <token>`  
  Corpo da requisição: `{ title, description, date, price, capacity, type, location, hasCertificate }`

- **Inscrição em Evento:**  
  `POST /api/events/:id/register`  
  Cabeçalho: `Authorization: Bearer <token>`

- **Emissão de Certificado:**  
  `GET /api/events/:id/certificate`  
  Cabeçalho: `Authorization: Bearer <token>`

## Fluxo de Uso

1. O usuário realiza o cadastro e login.
2. O organizador cria um evento com todas as informações necessárias.
3. Participantes visualizam a lista de eventos e se inscrevem.
4. Ao se inscrever, os participantes recebem um bilhete digital e um e-mail de confirmação.
5. Após a data do evento, participantes de eventos que oferecem certificado podem baixar seu certificado em PDF.


*Desenvolvido com dedicação para atender aos requisitos propostos e oferecer uma experiência completa de gerenciamento de eventos.*

