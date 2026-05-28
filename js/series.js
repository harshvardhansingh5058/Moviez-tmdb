// ── Series page JS ──
let currentPage = 1;
let currentGenre = '';

// ── Static Banner ──
fetch(`${baseUrl}/tv/top_rated?api_key=${apiKey}&language=en-US&page=1`)
    .then(r => r.json())
    .then(data => {
        const show = data.results[0];
        const banner = document.querySelector(".page-banner");
        if (banner) {
            banner.style.backgroundImage = `linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, #0a0a0a 100%), url(https://image.tmdb.org/t/p/original${show.backdrop_path})`;
            banner.style.backgroundSize = "cover";
            banner.style.backgroundPosition = "center";
        }
    });

// ── Grid mein series load ──
const loadSeriesGrid = async (page = 1, genre = '') => {
    let url;

    if (genre) {
        url = `${baseUrl}/discover/tv?api_key=${apiKey}&language=en-US&page=${page}&with_genres=${genre}`;
    } else {
        url = `${baseUrl}/tv/popular?api_key=${apiKey}&language=en-US&page=${page}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    const grid = document.getElementById("seriesGrid");

    grid.innerHTML = "";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById("seriesCount").textContent = `(${data.total_results?.toLocaleString()} series)`;

    data.results.forEach(show => {
        const card = createCard(show, 'tv');
        card.style.width = "100%";
        grid.appendChild(card);
    });

    renderPagination(page, data.total_pages, "seriesPagination");
};

// ── Pagination render ──
const renderPagination = (current, total, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    total = Math.min(total, 500);
    if (total <= 1) return;

    const createBtn = (label, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement("button");
        btn.className = "page-btn" + (isActive ? " active" : "") + (isDisabled ? " disabled" : "");
        btn.textContent = label;
        if (!isDisabled) {
            btn.addEventListener("click", () => {
                currentPage = page;
                loadSeriesGrid(page, currentGenre);
            });
        }
        return btn;
    };

    // Prev
    container.appendChild(createBtn("‹", current - 1, false, current === 1));

    // Page numbers
    let pages = [];
    if (total <= 7) {
        pages = Array.from({ length: total }, (_, i) => i + 1);
    } else {
        pages = [1];
        if (current > 3) pages.push("...");
        for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
            pages.push(i);
        }
        if (current < total - 2) pages.push("...");
        pages.push(total);
    }

    pages.forEach(p => {
        if (p === "...") {
            const dots = document.createElement("span");
            dots.className = "page-dots";
            dots.textContent = "...";
            container.appendChild(dots);
        } else {
            container.appendChild(createBtn(p, p, p === current));
        }
    });

    // Next
    container.appendChild(createBtn("›", current + 1, false, current === total));
};

// ── Genre filter ──
const filterGenre = (btn, genreId) => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentGenre = genreId;
    currentPage = 1;
    loadSeriesGrid(1, genreId);
};

// ── Close popup ──
document.getElementById("popup-close").addEventListener("click", () => {
    document.getElementById("movie-overlay").classList.remove("active");
    const iframe = document.querySelector("iframe");
    if (iframe) iframe.src = "";
});

document.getElementById("movie-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("movie-overlay")) {
        document.getElementById("movie-overlay").classList.remove("active");
        const iframe = document.querySelector("iframe");
        if (iframe) iframe.src = "";
    }
});

// ── Initial Load ──
loadSeriesGrid(1, '');

// ── TV Popup ──
const openTvPop = async (id) => {
    const overlay = document.getElementById("movie-overlay");
    overlay.classList.add("active");

    document.getElementById("popup-cast").innerHTML = "";
    document.getElementById("popup-similar").innerHTML = "";
    document.getElementById("popup-extra-details").innerHTML = "";
    document.getElementById("popup-chips").innerHTML = "";

    const [detail, credits, videos, similar] = await Promise.all([
        fetch(`${baseUrl}/tv/${id}?api_key=${apiKey}`).then(r => r.json()),
        fetch(`${baseUrl}/tv/${id}/credits?api_key=${apiKey}`).then(r => r.json()),
        fetch(`${baseUrl}/tv/${id}/videos?api_key=${apiKey}`).then(r => r.json()),
        fetch(`${baseUrl}/tv/${id}/similar?api_key=${apiKey}`).then(r => r.json()),
    ]);

    document.getElementById("popup-poster").src = `https://image.tmdb.org/t/p/w500${detail.poster_path}`;
    document.getElementById("popup-title").innerText = detail.name;
    document.getElementById("popup-tagline").innerText = detail.tagline || "";
    document.getElementById("popup-overview").innerText = detail.overview;

    const chipsEl = document.getElementById("popup-chips");
    chipsEl.innerHTML = "";
    const year = document.createElement("span");
    year.className = "p-chip";
    year.textContent = detail.first_air_date?.slice(0, 4);
    const seasons = document.createElement("span");
    seasons.className = "p-chip";
    seasons.textContent = detail.number_of_seasons + " Seasons";
    const rating = document.createElement("span");
    rating.className = "p-chip-rating";
    rating.textContent = "⭐ " + detail.vote_average?.toFixed(1) + "/10 (" + detail.vote_count + " votes)";
    chipsEl.appendChild(year);
    chipsEl.appendChild(seasons);
    chipsEl.appendChild(rating);

    const trailer = videos.results.find(v => v.type === "Trailer");
    const trailerPlaceholder = document.querySelector(".trailer-placeholder");
    trailerPlaceholder.innerHTML = "";

    if (trailer) {
        const thumbUrl = `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`;
        const img = document.createElement("img");
        img.src = thumbUrl;
        img.alt = "Trailer";
        const playBtn = document.createElement("div");
        playBtn.className = "play-btn";
        playBtn.textContent = "▶";
        trailerPlaceholder.appendChild(playBtn);
        trailerPlaceholder.appendChild(img);
        trailerPlaceholder.onclick = () => {
            const iframe = document.createElement("iframe");
            iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`;
            iframe.width = "100%";
            iframe.height = "100%";
            iframe.style.border = "none";
            iframe.allow = "autoplay";
            trailerPlaceholder.innerHTML = "";
            trailerPlaceholder.appendChild(iframe);
        };
    }

    const extraEl = document.getElementById("popup-extra-details");
    extraEl.innerHTML = "";
    const creator = detail.created_by?.[0]?.name || "N/A";
    const rows = [
        ["Creator", creator, true],
        ["First Air", detail.first_air_date || "N/A", false],
        ["Seasons", detail.number_of_seasons || "N/A", false],
        ["Episodes", detail.number_of_episodes || "N/A", false],
        ["Status", detail.status || "N/A", false],
        ["Language", detail.original_language?.toUpperCase() || "N/A", false],
    ];
    rows.forEach(([key, val, isRed]) => {
        const keyEl = document.createElement("span");
        keyEl.className = "pd-key";
        keyEl.textContent = key;
        const valEl = document.createElement("span");
        valEl.className = isRed ? "pd-val red" : "pd-val";
        valEl.textContent = val;
        extraEl.appendChild(keyEl);
        extraEl.appendChild(valEl);
    });

    const castEl = document.getElementById("popup-cast");
    castEl.innerHTML = "";
    credits.cast?.slice(0, 10).forEach(actor => {
        const card = document.createElement("div");
        card.className = "cast-card";
        const photo = document.createElement("img");
        photo.className = "cast-photo";
        photo.src = "https://image.tmdb.org/t/p/w185" + actor.profile_path;
        photo.alt = actor.name;
        const name = document.createElement("span");
        name.className = "cast-name";
        name.textContent = actor.name;
        const character = document.createElement("span");
        character.className = "cast-character";
        character.textContent = actor.character;
        card.appendChild(photo);
        card.appendChild(name);
        card.appendChild(character);
        castEl.appendChild(card);
    });

    const releaseDate = new Date(detail.first_air_date);
    const options = { day: "numeric", month: "long", year: "numeric" };
    document.getElementById("popup-release-date").textContent =
        releaseDate.toLocaleDateString("en-US", options).toUpperCase();
    const banner = document.getElementById("popup-release-banner");
    banner.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${detail.backdrop_path})`;
    banner.style.backgroundSize = "cover";
    banner.style.backgroundPosition = "center";

    const similarEl = document.getElementById("popup-similar");
    similarEl.innerHTML = "";
    similar.results?.slice(0, 10).forEach(show => {
        const card = document.createElement("div");
        card.className = "similar-card";
        card.onclick = () => openTvPop(show.id);
        const poster = document.createElement("img");
        poster.className = "similar-poster";
        poster.src = `https://image.tmdb.org/t/p/w342${show.poster_path}`;
        poster.alt = show.name;
        const title = document.createElement("span");
        title.className = "similar-title";
        title.textContent = show.name;
        const year = document.createElement("span");
        year.className = "similar-year";
        year.textContent = show.first_air_date?.slice(0, 4);
        card.appendChild(poster);
        card.appendChild(title);
        card.appendChild(year);
        similarEl.appendChild(card);
    });
};