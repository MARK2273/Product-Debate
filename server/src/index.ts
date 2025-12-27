import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { apiRoutes } from './routes/api';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.send('AI Debate Server Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
