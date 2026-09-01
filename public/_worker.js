export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Try to serve exact static asset
    let response = await env.ASSETS.fetch(request);
    if (response.status !== 404) {
      return response;
    }

    // 2. Map route paths to generated Next.js html files inside .next/server/app
    let pathname = url.pathname;
    if (pathname === "/" || pathname === "") {
      pathname = "/server/app/index.html";
    } else if (pathname === "/movies") {
      pathname = "/server/app/movies.html";
    } else if (pathname === "/series") {
      pathname = "/server/app/series.html";
    } else if (pathname === "/anime") {
      pathname = "/server/app/anime.html";
    } else if (pathname === "/trending") {
      pathname = "/server/app/trending.html";
    } else if (pathname === "/login") {
      pathname = "/server/app/login.html";
    } else if (pathname === "/profile") {
      pathname = "/server/app/profile.html";
    } else if (pathname === "/watchlist") {
      pathname = "/server/app/watchlist.html";
    } else if (pathname === "/admin") {
      pathname = "/server/app/admin.html";
    } else if (!pathname.includes(".")) {
      pathname = `/server/app${pathname}.html`;
    }

    const assetUrl = new URL(pathname, url.origin);
    response = await env.ASSETS.fetch(new Request(assetUrl, request));
    if (response.status !== 404) {
      return response;
    }

    // 3. Fallback to main index.html
    return env.ASSETS.fetch(new Request(new URL("/server/app/index.html", url.origin), request));
  }
};
