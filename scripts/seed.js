if (process.env.NODE_ENV === 'production') {
  console.error('El seed de demostración está bloqueado en producción');
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const { Client } = require('pg');
const config = require('../src/config');

const users = [
  { username: 'alice', password: 'Alice-demo-2026', role: 'user' },
  { username: 'bob', password: 'Bob-demo-2026', role: 'user' },
  { username: 'admin', password: 'Admin-demo-2026', role: 'admin' },
];

const notes = {
  alice: [
    ['Ideas para la reunión del lunes', 'Revisar objetivos del trimestre y priorizar tres temas.'],
    ['Lista de compras de oficina', 'Café, cuadernos, marcadores de colores.'],
    ['Pendientes de la semana', 'Actualizar presentación, responder correos, ordenar archivos.'],
  ],
  bob: [
    ['Resumen de la llamada con proveedor', 'Entrega confirmada para el jueves. Pedir factura.'],
    ['Plan de viaje (ficticio)', 'Ciudad Ejemplo, 3 días, reservar hotel con desayuno.'],
  ],
  admin: [['Checklist de la cuenta de equipo', 'Revisar altas y bajas de usuarios cada mes.']],
};

async function main() {
  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: config.databaseSslRejectUnauthorized } : false,
  });
  await client.connect();
  try {
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      const res = await client.query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO NOTHING RETURNING id',
        [u.username, hash, u.role]
      );
      if (res.rows.length > 0) {
        for (const [title, body] of notes[u.username]) {
          await client.query('INSERT INTO notes (owner_id, title, body) VALUES ($1, $2, $3)', [
            res.rows[0].id, title, body,
          ]);
        }
      }
    }
    console.log('Datos de ejemplo cargados');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('No se pudo cargar el seed:', err.message);
  process.exit(1);
});
