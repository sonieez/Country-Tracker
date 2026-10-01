const getCountries = async () => {
  const response = await fetch(
    'https://api.restcountries.com/countries/v5?response_fields=names.common,codes.alpha_2,flag.url_png&limit=10',
    { headers: {'Authorization': `Bearer ${process.env.API_KEY}`}}
  );
  const allCountries = await response.json();

  const validCountries = allCountries.data.objects.filter((country) => {
    return country.codes.alpha_2 
  });
  const countries = validCountries.map((country) => {
    return {
      name: country.names.common,
      code: country.codes.alpha_2,
      flag: country.flag.url_png
    }
  })

  console.log(countries);
} 

getCountries();
