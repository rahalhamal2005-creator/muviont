async function run() {
  const url = "https://muviont-player.vercel.app/v1/movies/1022789";
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status} ${res.statusText}`);
    const data = await res.json();
    console.log("Response keys:", Object.keys(data));
    if (data.sources && data.sources.length > 0) {
      console.log("Sources count:", data.sources.length);
      console.log("First source:", data.sources[0]);
    } else {
      console.log("No sources found.");
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

run();
