export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Try serving static file directly if path has an extension (js, css, png, etc.)
    if (url.pathname.includes(".")) {
      const directRes = await env.ASSETS.fetch(request);
      if (directRes.status !== 404) return directRes;
    }

    // 2. Map HTML pages
    let pagePath = url.pathname;
    if (pagePath === "/" || pagePath === "") {
      pagePath = "/server/app/index.html";
    } else if (pagePath === "/movies") {
      pagePath = "/server/app/movies.html";
    } else if (pagePath === "/series") {
      pagePath = "/server/app/series.html";
    } else if (pagePath === "/anime") {
      pagePath = "/server/app/anime.html";
    } else if (pagePath === "/trending") {
      pagePath = "/server/app/trending.html";
    } else if (pagePath === "/login") {
      pagePath = "/server/app/login.html";
    } else if (pagePath === "/profile") {
      pagePath = "/server/app/profile.html";
    } else if (pagePath === "/watchlist") {
      pagePath = "/server/app/watchlist.html";
    } else if (pagePath === "/admin") {
      pagePath = "/server/app/admin.html";
    } else if (!pagePath.includes(".")) {
      pagePath = `/server/app${pagePath}.html`;
    }

    const pageUrl = new URL(pagePath, url.origin);
    const pageRes = await env.ASSETS.fetch(new Request(pageUrl, request));
    if (pageRes.status !== 404) {
      return pageRes;
    }

    // 3. Fallback to index.html or raw static asset
    const indexRes = await env.ASSETS.fetch(new Request(new URL("/server/app/index.html", url.origin), request));
    if (indexRes.status !== 404) {
      return indexRes;
    }

    return env.ASSETS.fetch(request);
  }
};
