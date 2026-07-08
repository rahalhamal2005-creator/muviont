import { GET } from "../src/app/api/stream/route.ts";

process.env.CINEPRO_API_URL = "https://muviont-player.vercel.app";

async function run() {
  const req = new Request("http://localhost/api/stream?id=1022789&type=movie");
  console.log("Invoking local GET handler...");
  try {
    const res = await GET(req);
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("JSON response:", data);
  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
