import 'dotenv/config';
import express from 'express';
import { router } from './routes/index.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';

app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(router);

app.use((error, request, response, next) => {
  console.error(error);
  response.status(500).send('Unexpected server error.');
});

app.listen(port, host, () => {
  console.log(`Margin of Safety is running at http://${host}:${port}`);
});
