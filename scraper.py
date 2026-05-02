import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

# ---- Configuration ----
URL = "https://chlorofil.fr/actualites"
BASE_URL = "https://chlorofil.fr"
OUTPUT_FILE = "chlorofil.json"

# ---- Récupération de la page ----
def get_page(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.text

# ---- Extraction des articles ----
def parse_articles(html):
    soup = BeautifulSoup(html, "html.parser")
    articles = soup.find_all("article", class_="articletype-1")

    resultats = []

    for article in articles:

        # Titre
        titre_tag = article.find("span", itemprop="name")
        titre = titre_tag.get_text(strip=True) if titre_tag else "Sans titre"

        # Date
        date_tag = article.find("time")
        date = date_tag["datetime"] if date_tag else "Date inconnue"

        # Lien
        lien_tag = article.find("h1").find("a") if article.find("h1") else None
        lien = BASE_URL + lien_tag["href"] if lien_tag else BASE_URL

        # Description
        desc_tag = article.find("div", itemprop="description")
        description = desc_tag.get_text(strip=True) if desc_tag else ""

        # Image
        img_tag = article.find("img", class_="card-img-top")
        image = BASE_URL + img_tag["src"] if img_tag else ""

        resultats.append({
            "titre": titre,
            "date": date,
            "lien": lien,
            "description": description,
            "image": image
        })

    return resultats

# ---- Sauvegarde en JSON ----
def sauvegarder(articles, fichier):
    # 👇 On emballe les articles avec la date de mise à jour
    data = {
        "derniere_maj": datetime.utcnow().isoformat(),
        "actualites": articles
    }
    with open(fichier, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ {len(articles)} articles sauvegardés dans {fichier}")

# ---- Programme principal ----
if __name__ == "__main__":
    print(f"🔄 Scraping de {URL}...")
    html = get_page(URL)
    articles = parse_articles(html)
    sauvegarder(articles, OUTPUT_FILE)
    print(f"🕐 Dernière mise à jour : {datetime.utcnow().strftime('%d/%m/%Y %H:%M')} UTC")
