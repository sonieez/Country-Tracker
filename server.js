import express from 'express';
import { PrismaClient } from '@prisma/client';

const PORT = 3000;
const app = express();
const prisma = new PrismaClient();

app.get('/', (req, res) => {
  res.send("hello")
})

app.get('/countries', async (req, res) => {
  const countries = await prisma.country.findMany();
  res.json(countries);
})

app.listen(PORT, () => {
  console.log(`Server is running`)
})