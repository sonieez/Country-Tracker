import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCountries() {
  let allObjects = [];
  let offset = 0;
  let more = true;

  while (more) {
    const response = await fetch(
      `https://api.restcountries.com/countries/v5?response_fields=names.common,codes.alpha_2,flag.url_png&limit=100&offset=${offset}`,
      { headers: {'Authorization': `Bearer ${process.env.API_KEY}`}}
    );
    const allCountries = await response.json();

    allObjects.push(...allCountries.data.objects);

    more = allCountries.data.meta.more;

    offset += 100;
  }

  const validCountries = allObjects.filter((country) => {
    return country.codes.alpha_2 
  });
  const countries = validCountries.map((country) => {
    return {
      name: country.names.common,
      code: country.codes.alpha_2,
      flag: country.flag.url_png
    }
  })

  return countries;
} 

async function seed() {
  const countries = await getCountries();
  
  const result = await prisma.country.createMany({
    data: countries,
    skipDuplicates: true,
  });
  
  console.log(`${result.count} countries saved`); 
}

seed()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());