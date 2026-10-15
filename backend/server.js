import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import checkAuth from './src/middleware/auth.js';

const PORT = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: 'http://localhost:5173'
}))

app.get('/', (req, res) => {
  res.send("hello")
})

app.get('/countries', async (req, res, next) => {
  try {
    const search = req.query.search;
    if (search && typeof search !== 'string') {
      res.status(400).json({message: "Invalid search"});
      return;
    }
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc', 
      },
      where: {
        name: {
          contains: search ? search : '',
          mode: "insensitive",
        }
      },
    });
    res.json(countries);

  } catch(error) {
    next(error);
  }
})

app.get('/countries/:code', async (req, res, next) => {
  try{
    const code = req.params.code;
    if (!/^[A-Za-z]{2}$/.test(code)) {
      res.status(400).json({message: 'Invalid code'});
      return;
    }
    const country = await prisma.country.findUnique({
      where: {
        code: code.toUpperCase(),
      }
    });

    country ? res.json(country) : res.status(404).json({message: 'Not found'})

  } catch (error) {
    next(error);
  }
})

app.get('/me', checkAuth, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
  })
})

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({message: 'Problem within the server'})
})

app.listen(PORT, () => {
  console.log(`Server is running`)
})