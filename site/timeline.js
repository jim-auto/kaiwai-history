(() => {
  "use strict";

  const YEARS = [2020, 2021, 2022, 2023, 2024, 2025];
  const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

  const allData = {};
  let loaded = 0;

  YEARS.forEach((year) => {
    fetch(`../data/${year}.json`)
      .then((res) => res.ok ? res.json() : [])
      .then((memes) => { allData[year] = memes; })
      .catch(() => { allData[year] = []; })
      .finally(() => {
        loaded++;
        if (loaded === YEARS.length) {
          renderChart();
          renderHeatmap();
        }
      });
  });

  // --- View toggle ---
  document.querySelectorAll(".tl-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tl-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      document.querySelectorAll(".timeline-view").forEach((v) => v.classList.add("hidden"));
      document.getElementById(`${view}-view`).classList.remove("hidden");
    });
  });

  // --- Chart view: horizontal bars grouped by year ---
  function renderChart() {
    const container = document.getElementById("timeline-chart");
    let html = "";

    YEARS.forEach((year) => {
      const memes = allData[year] || [];
      // Sort by peak_month
      const sorted = [...memes].sort((a, b) => (a.peak_month || 1) - (b.peak_month || 1));

      html += `<div class="tl-year-group">`;
      html += `<div class="tl-year-label"><a href="year.html?y=${year}">${year}</a></div>`;
      html += `<div class="tl-year-bars">`;

      sorted.forEach((meme) => {
        const buzz = meme.buzz || 5;
        const month = meme.peak_month || 1;
        const width = buzz * 10;
        const hue = buzzToHue(buzz);

        html += `<div class="tl-bar-row">`;
        html += `  <span class="tl-bar-month">${MONTHS[month - 1]}</span>`;
        html += `  <div class="tl-bar-track">`;
        html += `    <div class="tl-bar" style="width:${width}%;background:hsl(${hue},75%,55%)" title="バズ度: ${buzz}/10"></div>`;
        html += `  </div>`;
        html += `  <span class="tl-bar-name">${escapeHtml(meme.name)}</span>`;
        html += `  <span class="tl-bar-buzz">${buzz}</span>`;
        html += `</div>`;
      });

      html += `</div></div>`;
    });

    container.innerHTML = html;
  }

  // --- Heatmap view: year x month grid ---
  function renderHeatmap() {
    const container = document.getElementById("timeline-heatmap");

    // Build grid data: year -> month -> [{name, buzz}]
    const grid = {};
    YEARS.forEach((y) => {
      grid[y] = {};
      for (let m = 1; m <= 12; m++) grid[y][m] = [];
      (allData[y] || []).forEach((meme) => {
        const m = meme.peak_month || 1;
        grid[y][m].push({ name: meme.name, buzz: meme.buzz || 5 });
      });
    });

    let html = `<div class="heatmap-grid">`;

    // Header row
    html += `<div class="hm-corner"></div>`;
    MONTHS.forEach((m) => {
      html += `<div class="hm-month-header">${m}</div>`;
    });

    // Data rows
    YEARS.forEach((year) => {
      html += `<div class="hm-year-header"><a href="year.html?y=${year}">${year}</a></div>`;
      for (let m = 1; m <= 12; m++) {
        const items = grid[year][m];
        const maxBuzz = items.length ? Math.max(...items.map((i) => i.buzz)) : 0;
        const count = items.length;
        const hue = maxBuzz ? buzzToHue(maxBuzz) : 0;
        const opacity = maxBuzz ? 0.15 + (maxBuzz / 10) * 0.85 : 0.05;
        const tooltip = items.map((i) => `${i.name} (${i.buzz})`).join("\n");

        html += `<div class="hm-cell" style="background:hsla(${hue},75%,55%,${opacity})" title="${escapeHtml(tooltip)}">`;
        if (count > 0) {
          html += `<span class="hm-count">${count}</span>`;
        }
        html += `</div>`;
      }
    });

    html += `</div>`;

    // Legend
    html += `<div class="hm-legend">`;
    html += `<span class="hm-legend-label">バズ度:</span>`;
    for (let b = 1; b <= 10; b++) {
      const hue = buzzToHue(b);
      html += `<div class="hm-legend-cell" style="background:hsl(${hue},75%,55%)" title="${b}">${b}</div>`;
    }
    html += `</div>`;

    container.innerHTML = html;
  }

  // Buzz 1-10 -> hue (blue to red)
  function buzzToHue(buzz) {
    // 1=blue(210), 10=red/pink(340)
    return 210 + ((buzz - 1) / 9) * 130;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
})();
