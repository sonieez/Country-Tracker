import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import checkAuth from './src/middleware/auth.js';

const PORT = process.env.PORT || 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.use(cors({
  origin: ['http://localhost:5173', 'https://stampz-project.vercel.app']
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

    const stats = await prisma.reviews.groupBy({
      by: ['countryId'],
      _avg: { rating: true },
      _count: true,
    });
    const statsByCountry = {};
    for (const s of stats) {
      statsByCountry[s.countryId]= s;
    }
    const countriesWithStats = countries.map((c) => {
      const s = statsByCountry[c.id];
      return {
        ...c,
        average: s?._avg.rating ?? null,
        count: s?._count ?? 0,
      };
    });

    res.json(countriesWithStats);

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

app.put('/countries/:code/review', checkAuth, async(req, res, next) => {
  try{
    const rating = req.body.rating;
    if (!(Number.isInteger(rating) && (1 <= rating && rating <= 5))) {
      res.status(400).json({ message: "Invalid rating"});
      return;
    }
    
    const rawText = req.body.text;
    if (typeof rawText !== 'string') {
      res.status(400).json({ message: "Invalid Review" });
      return;
    }
    const text = rawText.trim();
    if (text.length > 1000) {
      res.status(400).json({ message: "Invalid Review" });
      return;
    }

    const code = req.params.code;
    const country = await prisma.country.findUnique({where: {code}});
    if (!country) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const countryId = country.id;
    const userId = req.user.id;

    const review = await prisma.reviews.upsert({
      where: {userId_countryId: {userId, countryId}},
      create: {userId, countryId, rating, text}, 
      update: {rating, text}
    });

    res.json(review)
  } catch (error) {
    next(error)
  }
})

app.delete('/countries/:code/review', checkAuth, async (req, res, next) => {
  try {
    const code = req.params.code;
    const country = await prisma.country.findUnique({ where: { code } });
    if (!country) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const countryId = country.id;
    const userId = req.user.id;

    const result = await prisma.reviews.deleteMany({
      where: { userId, countryId },
    });
    if (result.count === 0) {
      res.status(404).json({ message: "Review not found" });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
})

app.get('/countries/:code/reviews', async (req, res, next) => {
  try{
    const code = req.params.code;
    const country = await prisma.country.findUnique({where: {code}});
    if (!country) {
      res.status(404).json({message: "Not found"})
      return;
    }
    const countryId = country.id;
    const reviews = await prisma.reviews.findMany({
      where: {countryId}, 
      include: {user: {select: {displayName: true, profilePicture: true}}},
      orderBy: { createdAt: 'desc' },
    });
    const count = reviews.length;
    const sum = reviews.reduce((sum, r) => sum + r.rating, 0);
    const average = count === 0 ? null : sum/count;
    
    res.json({reviews, average, count });
  } catch (error) {
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

app.get('/me/stamps', checkAuth, async (req,res,next) => {
  try{
    const userId = req.user.id;
    const [visitedCountries, wishlistCountries] = await Promise.all([
      prisma.visited.findMany({
        where: {userId},
        include: { country: true },
      }),
      prisma.wishlist.findMany({
        where: {userId},
        include: { country: true },
      })
    ]);
    res.json({
      visited: visitedCountries.map((v) => v.country.code), 
      wishlist: wishlistCountries.map((w) => w.country.code)
    })
  } catch (error) {
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