import asyncio
from playwright.async_api import async_playwright

async def test_full():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE ERROR] {err}"))

        print("1. Direct goto http://localhost:3000/movie/m-1423191...")
        res = await page.goto("http://localhost:3000/movie/m-1423191", wait_until="domcontentloaded")
        print(f"Status: {res.status}, URL: {page.url}")

        title = await page.text_content("h1")
        print(f"Movie Detail Title: {title}")

        watch_btn = await page.query_selector("a[href*='/watch/movie/']")
        if watch_btn:
            watch_href = await watch_btn.get_attribute("href")
            print(f"\n2. Clicking Watch Now button: {watch_href}")
            await watch_btn.click()
            await page.wait_for_timeout(3000)
            print(f"URL after watch click: {page.url}")

            # Check if player iframe or player container is visible
            player = await page.query_selector(".player-container, iframe")
            print(f"Player element found: {player is not None}")

        print("\n3. Testing Series route...")
        res_series = await page.goto("http://localhost:3000/series/s-1396", wait_until="domcontentloaded")
        print(f"Series Status: {res_series.status}, URL: {page.url}")
        series_title = await page.text_content("h1")
        print(f"Series Detail Title: {series_title}")

        print("\n4. Testing Anime route...")
        res_anime = await page.goto("http://localhost:3000/anime/a-21", wait_until="domcontentloaded")
        print(f"Anime Status: {res_anime.status}, URL: {page.url}")
        anime_title = await page.text_content("h1")
        print(f"Anime Detail Title: {anime_title}")

        print("\n--- Console Logs ---")
        for log in console_logs:
            print(log)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_full())
