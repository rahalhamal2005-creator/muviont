const TMDB_API_KEY = "4a844a108ab1e5bb99e60fdeeea1dbc8";

async function test() {
  const showId = 243206; // Pritam and Pedro
  // Watch providers
  const wpUrl = `https://api.themoviedb.org/3/tv/${showId}/watch/providers?api_key=${TMDB_API_KEY}`;
  const wpRes = await fetch(wpUrl);
  const wpData = await wpRes.json();
  console.log("Watch Providers Results for Pritam and Pedro:", JSON.stringify(wpData.results || "None", null, 2));

  // Reviews
  const revUrl = `https://api.themoviedb.org/3/tv/${showId}/reviews?api_key=${TMDB_API_KEY}`;
  const revRes = await fetch(revUrl);
  const revData = await revRes.json();
  console.log("Reviews Results Count for Pritam and Pedro:", revData.results?.length || 0);
}

test();
