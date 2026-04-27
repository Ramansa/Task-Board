const authSection = document.getElementById('auth-section');
const boardSection = document.getElementById('board-section');
const messageEl = document.getElementById('message');
const userInfoEl = document.getElementById('user-info');

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showLoginBtn = document.getElementById('show-login');
const showRegisterBtn = document.getElementById('show-register');
const logoutBtn = document.getElementById('logout');
const newCardForm = document.getElementById('new-card-form');

let currentUser = null;

const setMessage = (text, isError = true) => {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#b91c1c' : '#047857';
};

const api = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    ...options
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
};

const switchAuthTab = (mode) => {
  const loginMode = mode === 'login';
  loginForm.classList.toggle('hidden', !loginMode);
  registerForm.classList.toggle('hidden', loginMode);
  showLoginBtn.classList.toggle('active', loginMode);
  showRegisterBtn.classList.toggle('active', !loginMode);
};

showLoginBtn.addEventListener('click', () => switchAuthTab('login'));
showRegisterBtn.addEventListener('click', () => switchAuthTab('register'));

const renderCard = (card) => {
  const cardEl = document.createElement('article');
  cardEl.className = 'card';
  cardEl.innerHTML = `
    <h3>${card.title}</h3>
    <p>${card.description || ''}</p>
    <div class="actions">
      <button data-action="left">←</button>
      <button data-action="right">→</button>
      <button data-action="edit">Edit</button>
      <button data-action="delete">Delete</button>
    </div>
  `;

  const move = async (dir) => {
    const statuses = ['todo', 'in_progress', 'done'];
    const index = statuses.indexOf(card.status);
    const target = dir === 'left' ? statuses[index - 1] : statuses[index + 1];
    if (!target) return;

    await api(`/api/cards/${card.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: target })
    });
    await loadBoard();
  };

  cardEl.querySelector('[data-action="left"]').addEventListener('click', () => move('left'));
  cardEl.querySelector('[data-action="right"]').addEventListener('click', () => move('right'));

  cardEl.querySelector('[data-action="edit"]').addEventListener('click', async () => {
    const title = prompt('Title', card.title);
    if (title === null) return;
    const description = prompt('Description', card.description || '');
    if (description === null) return;

    await api(`/api/cards/${card.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, description })
    });

    await loadBoard();
  });

  cardEl.querySelector('[data-action="delete"]').addEventListener('click', async () => {
    if (!confirm('Delete this card?')) return;
    await api(`/api/cards/${card.id}`, { method: 'DELETE' });
    await loadBoard();
  });

  return cardEl;
};

const renderBoard = (cards) => {
  ['todo', 'in_progress', 'done'].forEach((status) => {
    const col = document.getElementById(`col-${status}`);
    col.innerHTML = '';
    cards
      .filter((card) => card.status === status)
      .sort((a, b) => (a.position - b.position) || (a.id - b.id))
      .forEach((card) => col.appendChild(renderCard(card)));
  });
};

const loadBoard = async () => {
  const data = await api('/api/cards');
  renderBoard(data.cards || []);
};

const setAuthState = async () => {
  if (currentUser) {
    authSection.classList.add('hidden');
    boardSection.classList.remove('hidden');
    userInfoEl.textContent = `${currentUser.name} (${currentUser.role})`;
    await loadBoard();
  } else {
    authSection.classList.remove('hidden');
    boardSection.classList.add('hidden');
    userInfoEl.textContent = '';
  }
};

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    currentUser = data.user;
    setMessage('Logged in successfully.', false);
    await setAuthState();
  } catch (err) {
    setMessage(err.message);
  }
});

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });

    currentUser = data.user;
    setMessage('Account created.', false);
    await setAuthState();
  } catch (err) {
    setMessage(err.message);
  }
});

logoutBtn.addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST', body: '{}' });
  currentUser = null;
  setMessage('Logged out.', false);
  await setAuthState();
});

newCardForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const title = document.getElementById('card-title').value;
    const description = document.getElementById('card-description').value;
    await api('/api/cards', {
      method: 'POST',
      body: JSON.stringify({ title, description, status: 'todo' })
    });
    newCardForm.reset();
    setMessage('Task added.', false);
    await loadBoard();
  } catch (err) {
    setMessage(err.message);
  }
});

const bootstrap = async () => {
  try {
    const me = await api('/api/auth/me');
    currentUser = me.user;
  } catch {
    currentUser = null;
  }
  await setAuthState();
};

bootstrap();
