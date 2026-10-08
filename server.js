import express from 'express';
import { PrismaClient } from '@prisma/client';

const PORT = 3000;
const app = express();
const prisma = new PrismaClient();

app.get('/', (req, res) => {
  res.send("hello")
})

app.get('/countries', async (req, res) => {
  try {
    const search = req.query.search;
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
    console.error(error);
    res.status(500).json({message: 'Problem within the server'})
  }
})

app.get('/countries/:code', async (req, res) => {
  try{
    const code = req.params.code;
    const countries = await prisma.country.findUnique({
      where: {
        code: code.toUpperCase(),
      }
    });

    countries ? res.json(countries) : res.status(404).json({message: 'Not found'})

  } catch (error) {
    console.error(error);
    res.status(500).json({message: 'Problem within the server'})
  }
})

app.listen(PORT, () => {
  console.log(`Server is running`)
})