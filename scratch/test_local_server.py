import asyncio
from playwright.async_api import async_playwright

async def test_local():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
        page.on("pageerror", lambda err: console_logs.append(f"[PAGE ERROR] {err}"))
        page.on("requestfailed", lambda req: console_logs.append(f"[REQ FAILED] {req.url} - {req.failure}"))

        print("Connecting to local app...")
        response = await page.goto("http://localhost:3000", wait_until="domcontentloaded")
        print(f"Home page status: {response.status}")
        await page.wait_for_timeout(2000)

        cards = await page.query_selector_all("a[href*='/movie/']")
        print(f"Found {len(cards)} movie links")
        
        # Print details of the first 5 links
        for idx, card in enumerate(cards[:5]):
            href = await card.get_attribute("href")
            is_visible = await card.is_visible()
            box = await card.bounding_box()
            print(f"Card {idx}: href={href}, visible={is_visible}, box={box}")

        if cards:
            card = cards[0]
            href = await card.get_attribute("href")
            print(f"\nTargeting card with href: {href}")
            
            # Click card directly via JS dispatch or mouse click
            print("Performing click...")
            await card.click(force=True)
            await page.wait_for_timeout(3000)
            print(f"URL after click: {page.url}")

        print("\n--- Console & Network Errors ---")
        for log in console_logs:
            print(log)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_local())
