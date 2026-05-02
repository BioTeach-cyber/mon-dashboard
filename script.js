// ─── DATE & HEURE ───────────────────────────────────────────

function getSemaineAB() {
  const now = new Date();
  const annee = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;

  const septembre = new Date(annee, 8, 1);
  const jourSemaine = septembre.getDay();
  const decalage = jourSemaine === 0 ? 1 : (jourSemaine === 1 ? 0 : 8 - jourSemaine);
  const depart = new Date(annee, 8, 1 + decalage);

  const diffMs = now - depart;
  const diffSemaines = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));

  return diffSemaines >= 0 ? (diffSemaines % 2 === 0 ? 'A' : 'B') : '?';
}

function majHorloge() {
  const now = new Date();
  document.getElementById('heure').textContent =
    now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('date').textContent =
    now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('semaine').textContent = 'Semaine ' + getSemaineAB();
}

setInterval(majHorloge, 1000);
majHorloge();

// ─── FAVORIS PAR ZONES ──────────────────────────────────────

fetch('data/favoris.json')
  .then(r => r.json())
  .then(data => {
    const grid = document.getElementById('grid-principal');
    const blocChlorofil = document.getElementById('bloc-chlorofil');

    // Calcul du nombre de colonnes : 1 (datetime) + nb zones
    const nbColonnes = 1 + data.zones.length;
    grid.style.gridTemplateColumns = `repeat(${nbColonnes}, minmax(0, 1fr))`;

    // Forcer datetime et chlorofil sur toute la largeur
    document.getElementById('bloc-datetime').style.gridColumn = '1';
    blocChlorofil.style.gridColumn = `1 / span ${nbColonnes}`;

    // Créer un bloc par zone, inséré AVANT le bloc chlorofil
    data.zones.forEach(zone => {
      const bloc = document.createElement('div');
      bloc.className = 'card bg-base-100 shadow-md';

      const body = document.createElement('div');
      body.className = 'card-body p-4';

      const titre = document.createElement('h2');
      titre.className = 'card-title text-sm mb-2';
      titre.textContent = zone.nom;
      body.appendChild(titre);

      const grilleFavs = document.createElement('div');
      grilleFavs.className = 'flex flex-wrap gap-2';

      zone.favoris.forEach(fav => {
        const a = document.createElement('a');
        a.href = fav.url;
        a.target = '_blank';
        a.className = 'favori-btn btn btn-ghost';
        a.innerHTML = `
          <img src="${fav.icone}" alt="${fav.nom}">
          <span>${fav.nom}</span>
        `;
        grilleFavs.appendChild(a);
      });

      body.appendChild(grilleFavs);
      bloc.appendChild(body);

      // Insérer avant le bloc chlorofil
      grid.insertBefore(bloc, blocChlorofil);
    });
  })
  .catch(e => console.error('Erreur favoris :', e));

// ─── FLUX CHLOROFIL ─────────────────────────────────────────

fetch('chlorofil.json')
  .then(r => r.json())
  .then(articles => {
    const container = document.getElementById('chlorofil');

    if (!articles || articles.length === 0) {
      container.innerHTML = '<p class="text-gray-400">Aucun article disponible.</p>';
      return;
    }

    articles.slice(0, 6).forEach(article => {
      const card = document.createElement('div');
      card.className = 'card bg-base-200 shadow-sm';

      const image = article.image
        ? `<figure><img src="${article.image}" alt="${article.titre}" class="w-full h-32 object-cover"></figure>`
        : '';

      card.innerHTML = `
        ${image}
        <div class="card-body p-3">
          <h3 class="font-semibold text-sm">${article.titre}</h3>
          <p class="text-xs text-gray-500">${article.date || ''}</p>
          <p class="text-xs">${article.description || ''}</p>
          <a href="${article.lien}" target="_blank" class="btn btn-xs btn-primary mt-2">Lire</a>
        </div>
      `;

      container.appendChild(card);
    });
  })
  .catch(e => console.error('Erreur Chlorofil :', e));

// ─── FLUX RSS ───────────────────────────────────────────────

fetch('data/flux-rss.json')
  .then(r => r.json())
  .then(data => {
    const grid = document.getElementById('grid-principal');
    const blocChlorofil = document.getElementById('bloc-chlorofil');

    const positions = {
      'haut-gauche': [],
      'haut-droit':  [],
      'bas-gauche':  [],
      'bas-droit':   []
    };

    // Trier les flux par position
    data.flux.forEach(f => {
      if (f.url && f.url.trim() !== '') {
        if (positions[f.position] !== undefined) {
          positions[f.position].push(f);
        }
      }
    });

    // Pour chaque flux avec une URL, créer un bloc et charger le RSS
    data.flux.forEach(f => {
      if (!f.url || f.url.trim() === '') return;

      const bloc = document.createElement('div');
      bloc.className = 'card bg-base-100 shadow-md';
      bloc.innerHTML = `
        <div class="card-body p-4">
          <h2 class="card-title text-sm mb-2">${f.nom || 'Flux RSS'}</h2>
          <ul class="flex flex-col gap-2" id="rss-${f.position}">
            <li class="text-xs text-gray-400">Chargement...</li>
          </ul>
        </div>
      `;

      // Insérer avant chlorofil
      grid.insertBefore(bloc, blocChlorofil);

      // Charger le flux via un proxy public (RSS2JSON)
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(f.url)}`;

      fetch(apiUrl)
        .then(r => r.json())
        .then(rssData => {
          const liste = document.getElementById(`rss-${f.position}`);
          liste.innerHTML = '';

          if (!rssData.items || rssData.items.length === 0) {
            liste.innerHTML = '<li class="text-xs text-gray-400">Aucun article.</li>';
            return;
          }

          rssData.items.slice(0, 5).forEach(item => {
            const li = document.createElement('li');
            li.className = 'text-xs border-b border-base-200 pb-1';
            li.innerHTML = `
              <a href="${item.link}" target="_blank" class="link link-hover font-medium">${item.title}</a>
              <span class="text-gray-400 block">${new Date(item.pubDate).toLocaleDateString('fr-FR')}</span>
            `;
            liste.appendChild(li);
          });
        })
        .catch(() => {
          const liste = document.getElementById(`rss-${f.position}`);
          liste.innerHTML = '<li class="text-xs text-red-400">Erreur de chargement.</li>';
        });
    });
  })
  .catch(e => console.error('Erreur flux RSS :', e));

