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

    if (!country) {
      res.status(404).json({message: "Not found"});
      return;
    }

      const [stats, visitedCount, wishlistCount] = await Promise.all([
      prisma.reviews.aggregate({
        where: { countryId: country.id },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.visited.count({ where: { countryId: country.id } }),
      prisma.wishlist.count({ where: { countryId: country.id } }),
    ]);
    const countryWithStats = {
      ...country,
      average: stats._avg.rating ?? null,
      count: stats._count,
      visitedCount,
      wishlistCount,
    }

    res.json(countryWithStats);

  } catch (error) {
    next(error);
  }
})

app.put('/countries/:code/stamp', checkAuth, async (req, res, next) => {
  try {
    const { code } = req.params;
    const { status } = req.body;

    if (!['visited', 'wishlist', 'none'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const country = await prisma.country.findUnique({ where: { code: code.toUpperCase() } });
    if (!country) return res.status(404).json({ error: 'Country not found' });

    const userId = req.user.id;
    const countryId = country.id;

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;

      await tx.visited.deleteMany({ where: { userId, countryId } });
      await tx.wishlist.deleteMany({ where: { userId, countryId } });

      if (status === 'visited') {
        await tx.visited.create({ data: { userId, countryId } });
      } else if (status === 'wishlist') {
        await tx.wishlist.create({ data: { userId, countryId } });
      }
    });

    res.json({ code: country.code, status });
  } catch (error) {
    next(error);
  }
});

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

app.put('/me', checkAuth, async (req, res, next) => {
  try {
    const { displayName, username, profilePicture } = req.body;
    const data = {};

    if (displayName !== undefined) {
      if (typeof displayName !== 'string') {
        return res.status(400).json({ message: 'Invalid name' });
      }
      const name = displayName.trim();
      if (name.length < 1 || name.length > 40) {
        return res.status(400).json({ message: 'Name must be 1-40 characters' });
      }
      data.displayName = name;
    }

    if (username !== undefined) {
      if (username === null || username === '') {
        data.username = null;
      } else {
        if (typeof username !== 'string') {
          return res.status(400).json({ message: 'Invalid username' });
        }
        const u = username.trim().toLowerCase();
        if (!/^[a-z0-9_]{3,20}$/.test(u)) {
          return res.status(400).json({ message: 'Username: 3-20 chars, a-z, 0-9 and _ only' });
        }
        data.username = u;
      }
    }

    if (profilePicture !== undefined) {
      if (profilePicture === null) {
        data.profilePicture = null;
      } else {
        let parsed;
        try {
          parsed = new URL(profilePicture);
        } catch {
          return res.status(400).json({ message: 'Invalid picture URL' });
        }
        if (parsed.protocol !== 'https:' || profilePicture.length > 500) {
          return res.status(400).json({ message: 'Invalid picture URL' });
        }
        data.profilePicture = profilePicture;
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, displayName: true, username: true, profilePicture: true },
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'This username is already taken' });
    }
    next(error);
  }
});

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

app.get('/me/profile', checkAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const [user, visitedRows, wishlistRows, reviews, followersCount, followingCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, displayName: true, username: true, profilePicture: true},
      }),
      prisma.visited.findMany({ where: { userId }, include: { country: true }}),
      prisma.wishlist.findMany({ where: { userId }, include: { country: true }}),
      prisma.reviews.findMany({
        where: { userId },
        include: { country: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);

    res.json({
      user,
      visited: visitedRows.map((v) => v.country),
      wishlist: wishlistRows.map((w) => w.country),
      reviews,
      followersCount,
      followingCount,
    });
  } catch (error) {
    next(error);
  }
})

app.get('/me/lists', checkAuth, async (req, res, next) => {
  try{
    const userId = req.user.id;
    const lists = await prisma.lists.findMany({
      where: { userId },
      include: { listItem: {include: {country : true}} },
      orderBy: { id: 'desc' },
    })

    res.json(
      lists.map((list) => ({
        id: list.id,
        name: list.name,
        countries: list.listItem.map((c) => c.country),
      })),
    )

  } catch (error) {
    next(error);
  }
})

app.post('/lists', checkAuth, async (req, res, next) => {
  try {
    const rawName = req.body.name;
    if (typeof rawName !== 'string') {
      res.status(400).json({ message: "Invalid name" });
      return;
    }
    const name = rawName.trim();
    if (name.length < 1 || name.length > 50) {
      res.status(400).json({ message: "Invalid name" });
      return;
    }

    const list = await prisma.lists.create({
      data: { userId: req.user.id, name },
    });

    res.status(201).json({ id: list.id, name: list.name, countries: [] });
  } catch (error) {
    next(error);
  }
})

app.delete('/lists/:id', checkAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    const userId = req.user.id;

    const list = await prisma.lists.findFirst({ where: { id, userId } });
    if (!list) {
      res.status(404).json({ message: "Not found" });
      return;
    }

    await prisma.$transaction([
      prisma.listItem.deleteMany({ where: { listId: id } }),
      prisma.lists.delete({ where: { id } }),
    ]);

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
})

app.put('/lists/:id/countries/:code', checkAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const code = req.params.code;
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    if (!/^[A-Za-z]{2}$/.test(code)) {
      res.status(400).json({ message: "Invalid code" });
      return;
    }
    const userId = req.user.id;

    const list = await prisma.lists.findFirst({ where: { id, userId } });
    if (!list) {
      res.status(404).json({ message: "List not found" });
      return;
    }
    const country = await prisma.country.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!country) {
      res.status(404).json({ message: "Country not found" });
      return;
    }

    await prisma.listItem.upsert({
      where: { listId_countryId: { listId: id, countryId: country.id } },
      create: { listId: id, countryId: country.id },
      update: {},
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
})

app.delete('/lists/:id/countries/:code', checkAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const code = req.params.code;
    if (!Number.isInteger(id)) {
      res.status(400).json({ message: "Invalid id" });
      return;
    }
    if (!/^[A-Za-z]{2}$/.test(code)) {
      res.status(400).json({ message: "Invalid code" });
      return;
    }
    const userId = req.user.id;

    const list = await prisma.lists.findFirst({ where: { id, userId } });
    if (!list) {
      res.status(404).json({ message: "List not found" });
      return;
    }
    const country = await prisma.country.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!country) {
      res.status(404).json({ message: "Country not found" });
      return;
    }

    await prisma.listItem.deleteMany({
      where: { listId: id, countryId: country.id },
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
})

app.get('/countries/:code/people', async (req, res, next) => {
  try {
    const code = req.params.code;
    if (!/^[A-Za-z]{2}$/.test(code)) {
      res.status(400).json({ message: "Invalid code" });
      return;
    }
    const country = await prisma.country.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!country) {
      res.status(404).json({ message: "Not found" });
      return;
    }
    const countryId = country.id;
    const userSelect = { id: true, displayName: true, username: true, profilePicture: true };

    const [visitedRows, wishlistRows] = await Promise.all([
      prisma.visited.findMany({
        where: { countryId },
        take: 12,
        include: { user: { select: userSelect } },
      }),
      prisma.wishlist.findMany({
        where: { countryId },
        take: 12,
        include: { user: { select: userSelect } },
      }),
    ]);

    res.json({
      visited: visitedRows.map((v) => v.user),
      wishlist: wishlistRows.map((w) => w.user),
    });
  } catch (error) {
    next(error);
  }
})

app.get('/users/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, displayName: true, username: true, profilePicture: true },
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const [visitedRows, wishlistRows, reviews, followersCount, followingCount] = await Promise.all([
      prisma.visited.findMany({ where: { userId: id }, include: { country: true } }),
      prisma.wishlist.findMany({ where: { userId: id }, include: { country: true } }),
      prisma.reviews.findMany({
        where: { userId: id },
        include: { country: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.follow.count({ where: { followingId: id } }),
      prisma.follow.count({ where: { followerId: id } }),
    ]);

    res.json({
      user,
      visited: visitedRows.map((v) => v.country),
      wishlist: wishlistRows.map((w) => w.country),
      reviews,
      followersCount,
      followingCount,
    });
  } catch (error) {
    next(error);
  }
})

app.put('/users/:id/follow', checkAuth, async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const userId = req.user.id;
    if (targetId === userId) {
      res.status(400).json({ message: "You cannot follow yourself" });
      return;
    }
    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId: userId, followingId: targetId } },
      create: { followerId: userId, followingId: targetId },
      update: {},
    });

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
})

app.delete('/users/:id/follow', checkAuth, async (req, res, next) => {
  try {
    await prisma.follow.deleteMany({
      where: { followerId: req.user.id, followingId: req.params.id },
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
})

app.get('/me/following', checkAuth, async (req, res, next) => {
  try {
    const rows = await prisma.follow.findMany({
      where: { followerId: req.user.id },
      include: {
        following: {
          select: { id: true, displayName: true, username: true, profilePicture: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows.map((r) => r.following));
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