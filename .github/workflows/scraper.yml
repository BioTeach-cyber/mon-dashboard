name: Scraper Chlorofil

on:
  schedule:
    - cron: '0 6 * * *'
  workflow_dispatch:

permissions:
  contents: write

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Installation Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Installation des bibliothèques
        run: pip install -r requirements.txt

      - name: Lancement du scraper
        run: python scraper.py

      - name: Sauvegarde du JSON
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add chlorofil.json
          git commit -m "Mise à jour automatique" || echo "Rien à mettre à jour"
          git push
