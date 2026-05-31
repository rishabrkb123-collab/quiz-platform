import { useState } from 'react';
import Leaderboard from '../components/Leaderboard.jsx';

const demoAccounts = {
  admin: { email: 'admin@quiz.com', password: 'password123' },
  user: { email: 'user1@quiz.com', password: 'password123' }
};

export default function AuthPage({ leaderboard, onAuth, onRefreshLeaderboard }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: 'admin@quiz.com',
    password: 'password123',
    role: 'normal_user'
  });

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function fillDemo(account) {
    setMode('login');
    setForm((current) => ({ ...current, ...demoAccounts[account] }));
  }

  function submit(event) {
    event.preventDefault();

    if (mode === 'login') {
      onAuth('login', { email: form.email, password: form.password });
      return;
    }

    onAuth('register', {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role
    });
  }

  return (
    <section className="auth-grid">
      <div className="panel-card auth-card">
        <div className="toggle-row">
          <button className={mode === 'login' ? 'active-tab' : ''} onClick={() => setMode('login')}>Login</button>
          <button className={mode === 'register' ? 'active-tab' : ''} onClick={() => setMode('register')}>Register</button>
        </div>

        <form onSubmit={submit} className="stacked-form">
          {mode === 'register' ? (
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} placeholder="Your name" />
            </label>
          ) : null}

          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={updateField} placeholder="you@example.com" />
          </label>

          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={updateField} placeholder="password" />
          </label>

          {mode === 'register' ? (
            <label>
              Role
              <select name="role" value={form.role} onChange={updateField}>
                <option value="normal_user">normal_user</option>
                <option value="admin">admin</option>
              </select>
            </label>
          ) : null}

          <button className="primary-button" type="submit">{mode === 'login' ? 'Login' : 'Register'}</button>
        </form>

        <div className="demo-row">
          <button className="ghost-button" onClick={() => fillDemo('admin')}>Use admin demo</button>
          <button className="ghost-button" onClick={() => fillDemo('user')}>Use user demo</button>
        </div>
      </div>

      <div className="panel-card">
        <div className="section-header">
          <div>
            <p className="eyebrow">Public</p>
            <h2>Leaderboard</h2>
          </div>
          <button className="ghost-button" onClick={onRefreshLeaderboard}>Refresh</button>
        </div>
        <Leaderboard leaderboard={leaderboard} />
      </div>
    </section>
  );
}
