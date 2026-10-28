const $ = (id) => document.getElementById(id);

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  if (res.status !== 204) {
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'Error inesperado');
    err.status = res.status;
    throw err;
  }
  return data;
}

let currentUser = null;

function show(view) {
  $('login-view').classList.toggle('hidden', view !== 'login');
  $('notes-view').classList.toggle('hidden', view !== 'notes');
  $('userbox').classList.toggle('hidden', view !== 'notes');
}

function renderNotes(notes) {
  const list = $('notes-list');
  list.innerHTML = '';
  $('notes-empty').classList.toggle('hidden', notes.length > 0);
  for (const note of notes) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = note.title;
    const p = document.createElement('p');
    p.textContent = note.body;
    const small = document.createElement('small');
    small.textContent = 'Actualizada: ' + new Date(note.updated_at).toLocaleString();
    const actions = document.createElement('div');
    actions.className = 'actions';
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'danger';
    del.textContent = 'Eliminar';
    del.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta nota?')) return;
      try {
        await api('DELETE', '/api/notes/' + note.id);
        await loadNotes();
      } catch (e) {
        alert(e.message);
      }
    });
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'secondary';
    edit.textContent = 'Editar';
    edit.addEventListener('click', () => startEdit(li, note));
    actions.append(edit, del);
    li.append(h, p, small, actions);
    list.append(li);
  }
}

function startEdit(li, note) {
  li.innerHTML = '';
  const title = document.createElement('input');
  title.type = 'text';
  title.maxLength = 200;
  title.value = note.title;
  const body = document.createElement('textarea');
  body.rows = 3;
  body.value = note.body;
  const err = document.createElement('p');
  err.className = 'error';
  const actions = document.createElement('div');
  actions.className = 'actions';
  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = 'Guardar';
  save.addEventListener('click', async () => {
    try {
      await api('PUT', '/api/notes/' + note.id, { title: title.value, body: body.value });
      await loadNotes();
    } catch (e) {
      err.textContent = e.message;
    }
  });
  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'secondary';
  cancel.textContent = 'Cancelar';
  cancel.addEventListener('click', () => loadNotes());
  actions.append(save, cancel);
  li.append(title, body, err, actions);
}

async function loadNotes() {
  const data = await api('GET', '/api/notes');
  renderNotes(data.notes);
}

function fillTable(id, rows) {
  const tbody = $(id).querySelector('tbody');
  tbody.innerHTML = '';
  for (const row of rows) {
    const tr = document.createElement('tr');
    for (const cell of row) {
      const td = document.createElement('td');
      td.textContent = cell;
      tr.append(td);
    }
    tbody.append(tr);
  }
}

async function loadAdmin() {
  const users = await api('GET', '/api/admin/users');
  fillTable('admin-users', users.users.map((u) => [u.id, u.username, u.role, u.note_count]));
  const notes = await api('GET', '/api/admin/notes');
  fillTable(
    'admin-notes',
    notes.notes.map((n) => [n.id, n.owner, n.title, new Date(n.updated_at).toLocaleString()])
  );
}

async function enterApp(user) {
  currentUser = user;
  $('whoami').textContent = user.username + ' (' + user.role + ')';
  show('notes');
  await loadNotes();
  $('admin-view').classList.toggle('hidden', user.role !== 'admin');
  if (user.role === 'admin') {
    await loadAdmin();
  }
}

$('login-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('login-error').textContent = '';
  try {
    const data = await api('POST', '/api/login', {
      username: $('login-username').value,
      password: $('login-password').value,
    });
    $('login-password').value = '';
    await enterApp(data.user);
  } catch (e) {
    $('login-error').textContent = e.message;
  }
});

$('logout-btn').addEventListener('click', async () => {
  await api('POST', '/api/logout');
  currentUser = null;
  $('admin-view').classList.add('hidden');
  show('login');
});

$('note-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('note-error').textContent = '';
  try {
    await api('POST', '/api/notes', {
      title: $('note-title').value,
      body: $('note-body').value,
    });
    $('note-title').value = '';
    $('note-body').value = '';
    await loadNotes();
  } catch (e) {
    $('note-error').textContent = e.message;
  }
});

(async function init() {
  try {
    const data = await api('GET', '/api/me');
    await enterApp(data.user);
  } catch (e) {
    show('login');
  }
})();
