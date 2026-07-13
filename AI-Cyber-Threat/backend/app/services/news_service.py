import httpx
import logging
import re
from datetime import datetime
from typing import List, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class NewsService:
    @classmethod
    async def fetch_cybersecurity_news(cls, limit: int = 50) -> List[Dict[str, Any]]:

        if not settings.NEWSDATA_API_KEY:
            logger.warning("NewsData API key is missing.")
            return []

        try:
            url = "https://newsdata.io/api/1/news"

            params = {
                "apikey": settings.NEWSDATA_API_KEY,
                "q": "cybersecurity",
                "language": "en",
                "size": limit
            }

            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=15.0)

            if response.status_code != 200:
                logger.error(f"NewsData API Error: {response.status_code}")
                return []

            data = response.json()
            results = data.get("results", [])

            articles = []

            for article in results:
                title = article.get("title", "")
                description = article.get("description", "")

                text = f"{title} {description}"

                cve_ids = list(set(re.findall(r"CVE-\d{4}-\d{4,7}", text, re.IGNORECASE)))

                threat_type = "Cyber Threat"

                lower = text.lower()

                if "ransomware" in lower:
                    threat_type = "Ransomware"
                elif "phishing" in lower:
                    threat_type = "Phishing"
                elif "vulnerability" in lower or "cve" in lower:
                    threat_type = "Vulnerability"
                elif "ddos" in lower:
                    threat_type = "DDoS"
                elif "breach" in lower:
                    threat_type = "Data Breach"

                published = datetime.utcnow()

                pub_date = article.get("pubDate")

                if pub_date:
                    try:
                        published = datetime.strptime(pub_date, "%Y-%m-%d %H:%M:%S")
                    except:
                        pass

                country = "Global"

                if article.get("country"):
                    country = article["country"][0]

                articles.append({
                    "title": title,
                    "description": description,
                    "source": article.get("source_id", "NewsData"),
                    "published_date": published,
                    "country": country,
                    "threat_type": threat_type,
                    "organization": "Unknown",
                    "malware_name": None,
                    "cve_ids": cve_ids,
                    "url": article.get("link")
                })

            return articles

        except Exception as e:
            logger.error(f"NewsData API failed: {e}")
            return []