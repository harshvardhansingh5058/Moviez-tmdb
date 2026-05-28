// ── Movie page extra JS ──
let currentPage = 1;
let currentGenre = '';

// ── Static Action Movie Banner ──
fetch(`${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&with_genres=28&page=1`)
    .then(r => r.json())
    .then(data => {
        const movie = data.results[0];
        const banner = document.getElementById("moviePageBanner");
        if (banner) {
            banner.style.backgroundImage = `linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, #0a0a0a 100%), url(https://image.tmdb.org/t/p/original${movie.backdrop_path})`;
            banner.style.backgroundSize = "cover";
            banner.style.backgroundPosition = "center";
        }
    });

// ── Grid mein movies load karo ──
const loadMoviesGrid = async (page = 1, genre = '') => {
    let url;

    if (genre) {
        url = `${baseUrl}/discover/movie?api_key=${apiKey}&language=en-US&page=${page}&with_genres=${genre}`;
    } else {
        url = `${baseUrl}/movie/popular?api_key=${apiKey}&language=en-US&page=${page}`;
    }

    const res = await fetch(url);
    const data = await res.json();
    const grid = document.getElementById("moviesGrid");

    grid.innerHTML = "";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    document.getElementById("movieCount").textContent = `(${data.total_results?.toLocaleString()} movies)`;

    data.results.forEach(movie => {
        const card = createCard(movie);
        card.style.width = "100%";
        grid.appendChild(card);
    });

    renderPagination(page, data.total_pages, "moviesPagination");
};

// ── Pagination render ──
const renderPagination = (current, total, containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    total = Math.min(total, 500); // TMDB max 500 pages
    if (total <= 1) return;

    const createBtn = (label, page, isActive = false, isDisabled = false) => {
        const btn = document.createElement("button");
        btn.className = "page-btn" + (isActive ? " active" : "") + (isDisabled ? " disabled" : "");
        btn.textContent = label;
        if (!isDisabled) {
            btn.addEventListener("click", () => {
                currentPage = page;
                if (containerId === "moviesPagination") loadMoviesGrid(page, currentGenre);
                else loadSeriesGrid(page, currentGenre);
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
    loadMoviesGrid(1, genreId);
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

// ── Load ──
loadMoviesGrid(1, '');
loadSection("movie/top_rated", "topRatedRow");
loadSection("movie/upcoming", "upcomingRow");
loadSection("movie/now_playing", "nowPlayingRow");