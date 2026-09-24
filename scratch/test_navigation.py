import asyncio
from playwright.async_api import async_playwright

async def test_site():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE ERROR] {err}"))

        print("Navigating to https://muviont.com...")
        response = await page.goto("https://muviont.com", wait_until="domcontentloaded", timeout=15000)
        print(f"Home status: {response.status}")
        await page.wait_for_timeout(3000)
        print(f"Current URL: {page.url}")

        # Find movie cards
        cards = await page.query_selector_all("a[href*='/movie/']")
        print(f"Found {len(cards)} movie detail links")

        watch_links = await page.query_selector_all("a[href*='/watch/']")
        print(f"Found {len(watch_links)} watch links")

        for idx, card in enumerate(cards[:5]):
            href = await card.get_attribute("href")
            print(f"Card {idx} href: {href}")

        if cards:
            first_card = cards[0]
            href = await first_card.get_attribute("href")
            print(f"\nClicking first card with href: {href}")
            
            # Click and watch navigation
            await first_card.click()
            await page.wait_for_timeout(4000)
            print(f"URL after click: {page.url}")

        print("\n--- Console Logs ---")
        for log in console_logs:
            print(log)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_site())
