import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime

# ---------------- CONFIG ----------------
HT_URL = "https://www.hindustantimes.com/india-news"
IE_URL = "https://indianexpress.com/section/india/"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}

#YOUR BACKEND API
API_URL = "https://your-backend.onrender.com/api/blogs/scraped"

CHECK_INTERVAL = 60
MAX_ARTICLES_PER_RUN = 50


# ---------------- SEND TO BACKEND ----------------
def send_to_api(article):
    try:
        payload = {
            "title": article["title"],
            "summary": article.get("summary", ""),
            "content": article.get("summary", ""),
            "sourceName": article["source"],
            "sourceUrl": article["link"],
            "category": "World",
        }

        res = requests.post(API_URL, json=payload, timeout=10)

        if res.status_code in [200, 201]:
            print(f"✅ Sent: {article['title']}")
        else:
            print(f"❌ Failed: {article['title']} → {res.status_code}")

    except Exception as e:
        print("API error:", e)


# ---------------- CONTENT SCRAPERS ----------------
def get_ht_content(url):
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")

        paragraphs = soup.find_all("p", class_="content")

        for p in paragraphs:
            text = p.text.strip()
            if len(text) > 50:
                return text

        return ""

    except Exception as e:
        print(f"HT content error: {e}")
        return ""


def get_ie_content(url):
    try:
        res = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")

        synopsis = soup.find("h2", class_="synopsis")
        if synopsis:
            return synopsis.text.strip()

        paragraphs = soup.select("div.story_details p")

        for p in paragraphs:
            text = p.text.strip()
            if len(text) > 50:
                return text

        return ""

    except Exception as e:
        print(f"IE content error: {e}")
        return ""


# ---------------- LIST SCRAPERS ----------------
def scrape_ht():
    news = []
    try:
        res = requests.get(HT_URL, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")

        articles = soup.find_all("div", class_="cartHolder")

        for art in articles:
            title_tag = art.find("h2", class_="hdg3")
            if not title_tag:
                continue

            a_tag = title_tag.find("a")
            if not a_tag:
                continue

            title = a_tag.text.strip()
            link = a_tag.get("href")

            time_tag = art.find("div", class_="dateTime")
            timestamp = time_tag.text.strip() if time_tag else ""

            news.append({
                "source": "Hindustan Times",
                "title": title,
                "link": link,
                "time": timestamp
            })

    except Exception as e:
        print("HT scrape error:", e)

    return news


def scrape_ie():
    news = []
    try:
        res = requests.get(IE_URL, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, "html.parser")

        articles = soup.find_all("div", class_="articles")

        for art in articles:
            title_tag = art.find("h2", class_="title")
            if not title_tag:
                continue

            a_tag = title_tag.find("a")
            if not a_tag:
                continue

            title = a_tag.text.strip()
            link = a_tag.get("href")

            date_tag = art.find("div", class_="date")
            timestamp = date_tag.text.strip() if date_tag else ""

            news.append({
                "source": "Indian Express",
                "title": title,
                "link": link,
                "time": timestamp
            })

    except Exception as e:
        print("IE scrape error:", e)

    return news


# ---------------- SYNC ENGINE ----------------
def sync_news():
    print(f"\n[{datetime.now()}] Checking for updates...")

    try:
        ht_news = scrape_ht()
        ie_news = scrape_ie()

        all_news = (ht_news + ie_news)[:MAX_ARTICLES_PER_RUN]

        for item in all_news:
            print(f"🆕 Processing: {item['title']}")

            # Fetch content
            if item["source"] == "Hindustan Times":
                summary = get_ht_content(item["link"])
            else:
                summary = get_ie_content(item["link"])

            item["summary"] = summary

            # 🔥 SEND TO BACKEND
            send_to_api(item)

            time.sleep(1)

    except Exception as e:
        print("Sync error:", e)


# ---------------- RUN LOOP ----------------
if __name__ == "__main__":
    print("🚀 News Sync Started (API Mode)...")

    while True:
        sync_news()
        time.sleep(CHECK_INTERVAL)