import express from 'express';
import { sequelize } from './models/index.js';
import {authRouter} from './route/authRoute.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req,res) => {
  res.status(200).json ({
    status :'success',
    message : 'APIs en marche',
  })
})

app.use('/api/v1/auth', authRouter)

app.use((req, res, next) => {
  res.status(404).json({
    status:'fail',
    message: 'Route inexistante',
  })
})

const PORT = process.env.APP_PORT || 4000;

app.listen(PORT, () => {
  console.log('Serveur démarré sur le port : ', PORT);
})