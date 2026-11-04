import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import checkAuth from './src/middleware/auth.js';

const PORT = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

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

app.put('/countries/:code/stamp', checkAuth, async(req, res, next) =>{
  try{
    let code = req.params.code;
    const status = req.body.status;
    const userId = req.user.id;
    if (!/^[A-Za-z]{2}$/.test(code)) {
      res.status(400).json({message: "Invalid code"});
      return;
    }
    code = code.toUpperCase();
    if (!["visited", "wishlist", "none"].includes(status)){
      res.status(400).json({message: "Invalid status"});
      return;
    }
    const country = await prisma.country.findUnique({where: { code }});
    if (!country) {
      res.status(404).json({message: "Not found"});
      return;
    } 
    const countryId = country.id;
    if (status === "visited") {
      await prisma.$transaction([
        prisma.wishlist.deleteMany({ where: {userId, countryId } }),
        prisma.visited.upsert({
          where: {userId_countryId: {userId, countryId}},
          create: {userId, countryId},
          update: {},
        }),
      ]);
    } else if (status === "wishlist") {
      await prisma.$transaction([
        prisma.visited.deleteMany({ where: { userId, countryId } }),
        prisma.wishlist.upsert({
          where: {userId_countryId: {userId, countryId}},
          create: {userId, countryId},
          update: {},
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.wishlist.deleteMany({where: {userId, countryId}}),
        prisma.visited.deleteMany({where: {userId, countryId}})
      ])
    }
    res.json({ code, status });

  } catch(error) {
    next(error);
  }
})

app.get('/me', checkAuth, async (req, res, next) => {
  try{
    const user = await prisma.user.upsert({
      where: {
        id: req.user.id,
      },
      create: {
        id: req.user.id,
        email: req.user.email,
        displayName: req.user.user_metadata.full_name,
        profilePicture: req.user.user_metadata.picture,
      },
      update: {}
    })
    res.json(user)
  } catch(error){
    next(error);
  }
})


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({message: 'Problem within the server'})
})

app.listen(PORT, () => {
  console.log(`Server is running`)
})