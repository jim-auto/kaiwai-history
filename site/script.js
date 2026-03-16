(() => {
  "use strict";

  const YEARS = [2025, 2024, 2023, 2022, 2021, 2020];

  // --- Index page: render year list with top memes ---
  const yearList = document.getElementById("year-list");
  if (yearList) {
    YEARS.forEach((year) => {
      const row = document.createElement("a");
      row.href = `year.html?y=${year}`;
      row.className = "year-row";
      row.innerHTML = `
        <span class="year-row-year">${year}</span>
        <span class="year-row-tags" id="tags-${year}"></span>
        <span class="year-row-count" id="count-${year}"></span>
        <span class="year-row-arrow">&rsaquo;</span>
      `;
      yearList.appendChild(row);

      fetch(`../data/${year}.json`)
        .then((res) => res.ok ? res.json() : [])
        .then((memes) => {
          const countEl = document.getElementById(`count-${year}`);
          if (countEl) countEl.textContent = `${memes.length}`;

          const tagsEl = document.getElementById(`tags-${year}`);
          if (tagsEl && memes.length) {
            const topMemes = [...memes]
              .sort((a, b) => (b.reach || b.buzz || 0) - (a.reach || a.buzz || 0))
              .slice(0, 3);
            tagsEl.innerHTML = topMemes
              .map((m) => `<span class="year-row-tag">${escapeHtml(m.name)}</span>`)
              .join("");
          }
        })
        .catch(() => {});
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

  const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

  function buzzToHue(reach) {
    // 1=blue(210), 5=pink(340)
    return 210 + ((reach - 1) / 4) * 130;
  }

  function createMemeCard(meme, rank) {
    const card = document.createElement("div");
    card.className = "meme-card fade-in";

    let html = `<div class="meme-rank">#${rank}</div>`;
    html += `<div class="meme-name">${escapeHtml(meme.name)}</div>`;

    // Buzz meter + peak month
    if (meme.reach || meme.buzz) {
      const reach = meme.reach || meme.buzz;
      const REACH_LABELS = ["", "界隈の一部", "界隈内で認知", "界隈外に波及", "SNS全体バズ", "社会現象"];
      const hue = buzzToHue(reach);
      const peakLabel = meme.peak_month ? MONTHS[meme.peak_month - 1] + "ピーク" : "";
      html += `<div class="meme-buzz">`;
      html += `  <span class="meme-buzz-label">${REACH_LABELS[reach] || ""}</span>`;
      html += `  <div class="meme-buzz-track"><div class="meme-buzz-fill" style="width:${reach * 20}%;background:hsl(${hue},75%,55%)"></div></div>`;
      html += `  <span class="meme-buzz-value">${reach}/5</span>`;
      html += `</div>`;
      if (peakLabel) {
        html += `<div class="meme-peak">${peakLabel}</div>`;
      }
    }

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
