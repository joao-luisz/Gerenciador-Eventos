import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css'; // Importando o CSS

function Register() {
  const [form, setForm] = useState({ role: 'PARTICIPANT' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/register', form);
    alert('Cadastrado com sucesso!');
    navigate('/login');
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Cadastro</h2>
        <input placeholder="Nome" onChange={e => setForm({ ...form, name: e.target.value })} />
        <input type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Senha" onChange={e => setForm({ ...form, password: e.target.value })} />
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
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axios.post('/login', form);
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
    navigate('/');
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input type="email" placeholder="Email" onChange={e => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Senha" onChange={e => setForm({ ...form, password: e.target.value })} />
        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

function EventList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    axios.get('/events')
      .then(res => setEvents(res.data))
      .catch(err => console.error('Erro ao carregar eventos:', err));
  }, []);

  return (
    <div className="container">
      <h2>Eventos Disponíveis</h2>
      <div className="event-list">
        {events.map(event => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            <p>Data: {new Date(event.date).toLocaleDateString()}</p>
            <p>Organizador: {event.organizers}</p>
            <p>Tipo: {event.type}</p>
            <button onClick={() => axios.post(`/events/${event.id}/register`, {}, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            }).then(() => alert('Inscrito com sucesso!'))}>
              Inscrever-se
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  return (
    <Router>
      <nav>
        <Link to="/">Home</Link>
        {!token ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Cadastro</Link>
          </>
        ) : (
          <button onClick={() => {
            localStorage.removeItem('token');
            setToken(null);
          }}>Logout</button>
        )}
      </nav>

      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/" element={<EventList />} />
      </Routes>
    </Router>
  );
}

export default App;