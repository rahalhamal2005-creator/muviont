async function run() {
  const url = "https://muviont-player.vercel.app/v1/tv/37854/seasons/1/episodes/1";
  console.log(`Fetching CinePro response from ${url}...`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Subtitles count:", data.subtitles ? data.subtitles.length : 0);
    if (data.subtitles && data.subtitles.length > 0) {
      console.log("First 5 subtitles:", data.subtitles.slice(0, 5));
    }
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
