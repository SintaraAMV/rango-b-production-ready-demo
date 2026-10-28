const config = require('./src/config');

if (!config.databaseUrl) {
  console.error('Falta la variable de entorno DATABASE_URL');
  process.exit(1);
}

const app = require('./src/app');

app.listen(config.port, () => {
  console.log(`TeamVault escuchando en el puerto ${config.port}`);
});
