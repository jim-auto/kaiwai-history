(() => {
  "use strict";

  const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

  // --- Index page: render year grid with meme counts ---
  const yearGrid = document.getElementById("year-grid");
  if (yearGrid) {
    let totalMemes = 0;
    let loaded = 0;

    YEARS.forEach((year) => {
      const a = document.createElement("a");
      a.href = `year.html?y=${year}`;
      a.className = "year-card";
      a.innerHTML = `
        <span class="year-card-year">${year}</span>
        <span class="year-card-count" id="count-${year}">...</span>
      `;
      yearGrid.appendChild(a);

      // Fetch count
      fetch(`../data/${year}.json`)
        .then((res) => res.ok ? res.json() : [])
        .then((memes) => {
          const count = memes.length;
          totalMemes += count;
          const el = document.getElementById(`count-${year}`);
          if (el) el.textContent = `${count} memes`;
        })
        .catch(() => {
          const el = document.getElementById(`count-${year}`);
          if (el) el.textContent = "0 memes";
        })
        .finally(() => {
          loaded++;
          if (loaded === YEARS.length) {
            const stats = document.getElementById("stats");
            if (stats) {
              stats.innerHTML = `<span>${YEARS.length} years</span><span class="stats-dot"></span><span>${totalMemes} memes</span>`;
            }
          }
        });
    });
  }

  // --- Year page: load memes from JSON ---
  const yearTitle = document.getElementById("year-title");
  const memeList = document.getElementById("meme-list");

  if (yearTitle && memeList) {
    const params = new URLSearchParams(window.location.search);
    const year = params.get("y");

    if (!year) {
      window.location.href = "index.html";
      return;
    }

    document.title = `${year} - PUA Meme History`;
    yearTitle.textContent = `${year}`;

    // Build prev/next navigation
    const yearIndex = YEARS.indexOf(parseInt(year));
    buildPager(yearIndex);

    fetch(`../data/${year}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("not found");
        return res.json();
      })
      .then((memes) => {
        if (!memes.length) {
          showEmpty();
          return;
        }
        // Show count
        const countEl = document.getElementById("meme-count");
        if (countEl) countEl.textContent = `${memes.length} memes`;

        memes.forEach((meme, i) => {
          memeList.appendChild(createMemeCard(meme, i + 1));
        });

        // Animate cards
        requestAnimationFrame(() => {
          document.querySelectorAll(".meme-card").forEach((card, i) => {
            card.style.animationDelay = `${i * 0.06}s`;
          });
        });
      })
      .catch(() => {
        showEmpty();
      });
  }

  function buildPager(yearIndex) {
    const pager = document.getElementById("year-pager");
    if (!pager) return;

    let html = "";
    if (yearIndex < YEARS.length - 1) {
      const prev = YEARS[yearIndex + 1];
      html += `<a href="year.html?y=${prev}" class="pager-link">&larr; ${prev}</a>`;
    } else {
      html += `<span></span>`;
    }
    if (yearIndex > 0) {
      const next = YEARS[yearIndex - 1];
      html += `<a href="year.html?y=${next}" class="pager-link">${next} &rarr;</a>`;
    } else {
      html += `<span></span>`;
    }
    pager.innerHTML = html;
  }

  function showEmpty() {
    const el = document.getElementById("meme-list");
    if (el) {
      el.innerHTML =
        '<div class="empty-state"><p>この年のミームはまだ登録されていません。<br>data/ フォルダにJSONを追加してください。</p></div>';
    }
  }

  function createMemeCard(meme, rank) {
    const card = document.createElement("div");
    card.className = "meme-card fade-in";

    let html = `<div class="meme-rank">#${rank}</div>`;
    html += `<div class="meme-name">${escapeHtml(meme.name)}</div>`;

    if (meme.description) {
      html += `<div class="meme-description">${escapeHtml(meme.description)}</div>`;
    }

    if (meme.origin) {
      html += `<div class="meme-origin">${escapeHtml(meme.origin)}</div>`;
    }

    if (meme.image) {
      html += `<img class="meme-image" src="${escapeHtml(meme.image)}" alt="${escapeHtml(meme.name)}" loading="lazy">`;
    }

    card.innerHTML = html;
    return card;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Lightbox ---
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");

  if (lightbox && lightboxImg) {
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("meme-image")) {
        lightboxImg.src = e.target.src;
        lightboxImg.alt = e.target.alt;
        lightbox.classList.add("active");
      }
    });

    lightbox.addEventListener("click", () => {
      lightbox.classList.remove("active");
      lightboxImg.src = "";
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("active")) {
        lightbox.classList.remove("active");
        lightboxImg.src = "";
      }
    });
  }
})();
