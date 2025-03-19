import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Função para decodificar token JWT
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

function Register() {
  const [form, setForm] = useState({ role: 'PARTICIPANT' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { name, email, password, role } = form;
      if (!name || !email || !password) {
        setError('Todos os campos são obrigatórios');
        return;
      }
      await axios.post('/api/register', form);
      alert('Cadastro realizado!');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro no cadastro');
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Cadastro</h2>
        {error && <div className="error-message">{error}</div>}
        <input placeholder="Nome" onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Senha" onChange={e => setForm({ ...form, password: e.target.value })} required />
        <select onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="PARTICIPANT">Participante</option>
          <option value="ORGANIZER">Organizador</option>
        </select>
        <button type="submit">Cadastrar</button>
      </form>
    </div>
  );
}

function Login({ setToken }) {
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { email, password } = form;
      if (!email || !password) {
        setError('Email e senha são obrigatórios');
        return;
      }
      const res = await axios.post('/api/login', form);
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro no login');
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <input type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input type="password" placeholder="Senha" onChange={e => setForm({ ...form, password: e.target.value })} required />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

function EventList() {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/events')
      .then(res => {
        const formattedEvents = res.data.map(event => ({
          ...event,
          date: new Date(event.date).toLocaleString()
        }));
        setEvents(formattedEvents);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Erro ao carregar eventos');
      });
  }, []);

  const handleRegistration = async (eventId) => {
    try {
      const res = await axios.post(`/api/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Inscrição realizada com sucesso!');
      console.log('Ticket:', res.data.ticketCode);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro na inscrição';
      alert(errorMessage);
      setError(errorMessage);
    }
  };

  const handleCertificate = async (eventId) => {
    try {
      const res = await axios.get(`/api/events/${eventId}/certificate`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificate.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao emitir certificado';
      alert(errorMessage);
    }
  };

  const now = new Date();

  return (
    <div className="container">
      <h2>Eventos Disponíveis</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="event-grid">
        {events.map(event => {
          const eventDate = new Date(event.date);
          return (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              <p>Data: {event.date}</p>
              <p>Tipo: {event.type}</p>
              <p>Local: {event.location}</p>
              <p>Vagas: {event.capacity}</p>
              <button onClick={() => handleRegistration(event.id)}>
                Inscrever-se
              </button>
              {event.hasCertificate && eventDate <= now && (
                <button onClick={() => handleCertificate(event.id)}>
                  Emitir Certificado
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CreateEvent() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().slice(0, 16),
    price: 0,
    capacity: '',
    type: 'ONLINE',
    location: '',
    hasCertificate: false
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { title, description, date, price, capacity, type, location } = form;
      if (!title || !description || !date || !capacity || !type || !location) {
        setError('Todos os campos são obrigatórios');
        return;
      }
      await axios.post('/api/events', form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Evento criado com sucesso!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar evento');
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Criar Evento</h2>
        {error && <div className="error-message">{error}</div>}
        <input placeholder="Título" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        <textarea placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
        <input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
        <input type="number" placeholder="Preço" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <input type="number" placeholder="Capacidade" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} required />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option value="ONLINE">Online</option>
          <option value="PRESENTIAL">Presencial</option>
        </select>
        <input placeholder="Local/URL" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
        <label>
          <input type="checkbox" checked={form.hasCertificate} onChange={e => setForm({ ...form, hasCertificate: e.target.checked })} />
          Emitir certificados
        </label>
        <button type="submit">Criar Evento</button>
      </form>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      setUserRole(decoded?.role);
    }
  }, [token]);

  return (
    <Router>
      <nav className="navbar">
        <Link to="/" className="logo">Eventos</Link>
        <div className="nav-links">
          {!token ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Cadastro</Link>
            </>
          ) : (
            <>
              {userRole === 'ORGANIZER' && <Link to="/create-event">Criar Evento</Link>}
              <button onClick={() => {
                localStorage.removeItem('token');
                setToken(null);
              }} className="logout-btn">Sair</button>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/" element={<EventList />} />
      </Routes>
    </Router>
  );
}

export default App;
