const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Configuração do Banco de Dados
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Modelos
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('PARTICIPANT', 'ORGANIZER'), defaultValue: 'PARTICIPANT' }
});

const Event = sequelize.define('Event', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.DATE, allowNull: false },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('ONLINE', 'PRESENTIAL'), defaultValue: 'ONLINE' },
  location: { type: DataTypes.STRING, allowNull: false },
  hasCertificate: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const Registration = sequelize.define('Registration', {
  ticketCode: { type: DataTypes.STRING, allowNull: false },
  paymentStatus: { type: DataTypes.ENUM('PENDING', 'PAID', 'FREE'), defaultValue: 'FREE' }
});

// Relacionamentos
User.hasMany(Event);
Event.belongsTo(User);
User.hasMany(Registration);
Event.hasMany(Registration);

// Autenticação JWT
const SECRET = 'faculdade2024';
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Configuração de Email (usando Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'azjoaoluis7@gmail.com', 
    pass: 'qzue lkmc axyx oyls' 
  }
});

// Rotas da API
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    const user = await User.create({ name, email, password, role });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  const user = await User.findOne({ where: { email, password } });
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });
  const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
  res.json({ token });
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{ model: User, attributes: ['name'] }]
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar eventos' });
  }
});

app.post('/api/events', authMiddleware, async (req, res) => {
  if (req.user.role !== 'ORGANIZER') {
    return res.status(403).json({ error: 'Apenas organizadores podem criar eventos' });
  }
  try {
    const { title, description, date, price, capacity, type, location, hasCertificate } = req.body;
    if (!title || !description || !date || !capacity || !type || !location) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    const event = await Event.create({ 
      title,
      description,
      date,
      price,
      capacity,
      type,
      location,
      hasCertificate,
      UserId: req.user.id
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/events/:id/register', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Verificar se o usuário já está inscrito
    const existingRegistration = await Registration.findOne({
      where: { UserId: req.user.id, EventId: event.id }
    });
    if (existingRegistration) {
      return res.status(400).json({ error: 'Você já está inscrito neste evento' });
    }

    // Verificar capacidade
    if (event.capacity) {
      const registrationsCount = await Registration.count({ where: { EventId: event.id } });
      if (registrationsCount >= event.capacity) {
        return res.status(400).json({ error: 'Evento lotado' });
      }
    }
    
    // Criar registro
    const ticketCode = `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const registration = await Registration.create({
      ticketCode,
      UserId: req.user.id,
      EventId: event.id,
      paymentStatus: event.price > 0 ? 'PENDING' : 'FREE'
    });

    // Enviar email
    try {
      const user = await User.findByPk(req.user.id);
      await transporter.sendMail({
        to: user.email,
        subject: 'Inscrição Confirmada',
        text: `Seu ticket para o evento ${event.title} é: ${ticketCode}`
      });
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
    }

    res.status(201).json(registration);
  } catch (err) {
    console.error('Erro na inscrição:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Nova rota para emissão de certificado
app.get('/api/events/:id/certificate', authMiddleware, async (req, res) => {
  try {
    // Buscar o evento pelo ID
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Evento não encontrado' });
    }
    
    // Verificar se o evento possui certificado
    if (!event.hasCertificate) {
      return res.status(400).json({ error: 'Este evento não possui certificado' });
    }
    
    // Verificar se a data do evento já passou
    if (new Date(event.date) > new Date()) {
      return res.status(400).json({ error: 'O evento ainda não aconteceu' });
    }
    
    // Verificar se o usuário está inscrito no evento
    const registration = await Registration.findOne({
      where: { UserId: req.user.id, EventId: event.id }
    });
    if (!registration) {
      return res.status(403).json({ error: 'Usuário não inscrito no evento' });
    }
    
    // Buscar informações do usuário
    const user = await User.findByPk(req.user.id);
    
    // Gerar o PDF com PDFKit e enviá-lo como resposta
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
    doc.pipe(res);

    // Conteúdo do certificado
    doc.fontSize(26).text('Certificado de Participação', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text(`Certificamos que ${user.name} participou do evento: ${event.title}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(16).text(`Data do evento: ${new Date(event.date).toLocaleString()}`, { align: 'center' });
    doc.moveDown();
    doc.text('Obrigado por participar!', { align: 'center' });
    
    doc.end();
  } catch (err) {
    console.error('Erro ao gerar certificado:', err);
    res.status(500).json({ error: 'Erro ao gerar certificado' });
  }
});

// Inicialização
sequelize.sync().then(() => {
  app.listen(3001, () => console.log('Backend rodando em http://localhost:3001'));
});
