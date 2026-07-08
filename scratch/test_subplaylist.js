async function run() {
  const url = "https://muviont-player.vercel.app/v1/proxy?data=%7B%22url%22%3A%22https%3A%2F%2Ffuturefocusedentrepreneurs.site%2FnnQPPoSQm%2Fpl%2FH4sIAAAAAAAAAw3NQXKCMBQA0CuRAA50V4cIRQODIR9hF_xoJKDpSKnN6evirV8UqWHjxSSkFxVGqLw4UJeQKoLRJuovmw_FdNJPeSpM5Ut2peeGeXCCtmy6xwC2HSRbwRDHR6wKs0Ar9VoB6l6SJ8rnL_fRL6Q9CgIas84UVO.GcfqRWV51d_jmda4GCQpd4XiaU5VOovaN6whW5WkiR19XPbWLyDQV4rnWdx4qZoO3STg4KtJ5XHZNKZesm23SNiwAuhwq.QjQn_723vsz7cqzzxdn8a0muoXZOrHLS94U.YHYG7ovx31r.wSkmvX.WE8TjnqsGYbDfH31sD2BCeGcGHdOOVXsStDgFp0X_wOw3QuHQQEAAA--%2F7a67bab9038b6ca38d13b08cead24c49%2Findex.m3u8%3Ftoken%3D%22%2C%22headers%22%3A%7B%22User-Agent%22%3A%22Mozilla%2F5.0%20(X11%3B%20Ubuntu%3B%20Linux%20x86_64%3B%20rv%3A94.0)%20AppleWebKit%2F537.36%20(KHTML%2C%20like%20Gecko)%20Chrome%2F119.9.2816.61%20Safari%2F537.36%22%2C%22Referer%22%3A%22https%3A%2F%2Fbrightpathsignals.com%2F%22%2C%22Origin%22%3A%22https%3A%2F%2Fbrightpathsignals.com%22%2C%22Accept%22%3A%22*%2F*%22%2C%22x-vercel-id%22%3A%22cdg1%3Aiad1%3A%3A7tzl9-1783545046745-f8954700557f%22%2C%22x-invocation-id%22%3A%22cdg1%3Aiad1%3A%3A7tzl9-1783545046745-f8954700557f%22%7D%7D";
  
  console.log("Fetching sub-playlist...");
  try {
    const res = await fetch(url);
    console.log("Status:", res.status, res.statusText);
    console.log("Content-Type:", res.headers.get("content-type"));
    const text = await res.text();
    console.log("Body length:", text.length);
    console.log("Body preview:\n", text.substring(0, 1000));
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
