const apiKey = "583557707b3a31dc69f1b2d80d395adf"
const baseUrl = "https://api.themoviedb.org/3";
const imgUrl = "https://image.tmdb.org/t/p/w342";
const backdropUrl = "https://image.tmdb.org/t/p/w500"
const heroUrl = "https://image.tmdb.org/t/p/original"

const fetchMovies = async (category) => {
  const response = await fetch(`${baseUrl}/${category}?api_key=${apiKey}&language=en-US`)
  const data = await response.json()
  return data.results
}

const createCard = (item, type = 'movie') => {
  const card = document.createElement("div")
  card.className = "card";

  const img = document.createElement("img")
  img.src = imgUrl + item.poster_path
  img.alt = type === 'tv' ? item.name : item.title;

  const info = document.createElement("div")
  info.className = "card-info"

  const title = document.createElement("p")
  title.textContent = type === 'tv' ? item.name : item.title;

  const year = document.createElement("span")
  year.className = "card-year"
  year.textContent = (type === 'tv' ? item.first_air_date : item.release_date)?.slice(0, 4)

  const rating = document.createElement("span")
  rating.className = "rating"
  rating.textContent = "⭐ " + item.vote_average?.toFixed(1)

  info.appendChild(title)
  info.appendChild(year)
  card.appendChild(img)
  card.appendChild(info)
  info.appendChild(rating)

  // movie → openPop | tv → openTvPop
  card.addEventListener("click", () => type === 'tv' ? openTvPop(item.id) : openPop(item.id))

  return card
};

// loadSection
const loadSection = async (category, rowId) => {
  const movies = await fetchMovies(category);
  if (rowId === "trendingRow") {
    startHeroSlideshow(movies)
    return
  }

  const row = document.getElementById(rowId);
  if (!row) return
  row.innerHTML = "";

  movies.forEach(movie => {
    const card = createCard(movie);
    row.appendChild(card);
  });
};

loadSection("trending/movie/week", "trendingRow");
loadSection("movie/now_playing", "nowPlayingRow");
loadSection("trending/movie/day", "trendingTodayRow");
loadSection("movie/upcoming", "upcomingRow");
loadSection("movie/top_rated", "topRatedRow");
loadSection("movie/popular", "popularRow");
loadSection("trending/movie/week", "trendingWeekRow");

const startHeroSlideshow = (movies) => {
  if (!document.querySelector(".hero-bg")) return
  const randomIndex = () => Math.floor(Math.random() * movies.length)
  let index = randomIndex()
  let interval;

  const updateHero = () => {
    const movie = movies[index]
    document.querySelector(".hero-bg").style.backgroundImage = `url(${heroUrl}${movie.backdrop_path})`
    document.querySelector(".hero-title").textContent = movie.title
    document.querySelector(".hero-rating").textContent = "⭐ " + movie.vote_average
    document.querySelector(".hero-desc").textContent = movie.overview
    document.querySelector(".hero-year").textContent = movie.release_date.slice(0, 4)
    index = randomIndex()
    document.querySelector(".btn-list").onclick = () => openPop(movie.id)
  }

  updateHero()
  interval = setInterval(updateHero, 5000)

  const heroBg = document.querySelector(".hero")
  heroBg.addEventListener("mouseenter", () => clearInterval(interval))
  heroBg.addEventListener("mouseleave", () => {
    interval = setInterval(updateHero, 3000)
  })
}

// Search
const closeSearch = () => {
  const dropdown = document.getElementById("searchDropdown")
  dropdown.classList.remove("active")
  dropdown.innerHTML = ""
  document.getElementById("searchInput").value = ""
  document.getElementById("searchClear").classList.remove("visible")
}

const searchMovie = async (query) => {
  const url = `${baseUrl}/search/movie?api_key=${apiKey}&query=${query}`;
  const response = await fetch(url)
  const data = await response.json();
  return data.results;
}

document.getElementById("searchInput").addEventListener("input", async (e) => {
  const query = e.target.value.trim()
  const dropdown = document.getElementById("searchDropdown")
  const clearBtn = document.getElementById("searchClear")

  clearBtn.classList.toggle("visible", e.target.value.length > 0)

  if (!query) {
    dropdown.classList.remove("active")
    dropdown.innerHTML = ""
    return
  }

  dropdown.classList.add("active")
  dropdown.innerHTML = ""
  const loading = document.createElement("div")
  loading.className = "search-loading"
  loading.textContent = "🔍 Searching..."
  dropdown.appendChild(loading)

  const movies = await searchMovie(query)
  dropdown.innerHTML = ""

  if (!movies || movies.length === 0) {
    const empty = document.createElement("div")
    empty.className = "search-empty"
    empty.textContent = `No results found for "${query}"`
    dropdown.appendChild(empty)
  } else {
    movies.slice(0, 10).forEach(movie => {
      const item = document.createElement("div")
      item.className = "search-item"

      const icon = document.createElement("i")
      icon.className = "fa-solid fa-magnifying-glass search-item-icon"

      const title = document.createElement("span")
      title.className = "search-item-title"
      title.textContent = movie.title

      item.appendChild(icon)
      item.appendChild(title)
      item.addEventListener("click", () => {
        openPop(movie.id)
        closeSearch()
      })
      dropdown.appendChild(item)
    })
  }
})

document.addEventListener("click", (e) => {
  if (!document.getElementById("searchBox").contains(e.target)) closeSearch()
})

document.getElementById("searchClear").addEventListener("click", () => closeSearch())

// Popup
const movieOverlay = document.getElementById("movie-overlay")
const colseBtn = document.getElementById("popup-close")

colseBtn.addEventListener("click", () => {
  movieOverlay.classList.remove("active")
})

movieOverlay.addEventListener("click", (e) => {
  if (e.target === movieOverlay) {
    movieOverlay.classList.remove("active")
    const iframe = document.querySelector("iframe")
    if (iframe) iframe.src = ""
  }
})

const openPop = async (id) => {
  movieOverlay.classList.add("active")

  document.getElementById("popup-cast").innerHTML = ""
  document.getElementById("popup-similar").innerHTML = ""
  document.getElementById("popup-extra-details").innerHTML = ""
  document.getElementById("popup-chips").innerHTML = ""

  const [detail, credits, videos, similar] = await Promise.all([
    fetch(`${baseUrl}/movie/${id}?api_key=${apiKey}`).then(r => r.json()),
    fetch(`${baseUrl}/movie/${id}/credits?api_key=${apiKey}`).then(r => r.json()),
    fetch(`${baseUrl}/movie/${id}/videos?api_key=${apiKey}`).then(r => r.json()),
    fetch(`${baseUrl}/movie/${id}/similar?api_key=${apiKey}`).then(r => r.json()),
  ])

  document.getElementById("popup-poster").src = `${backdropUrl}${detail.poster_path}`

  const trailer = videos.results.find(v => v.type === "Trailer")
  const trailerPlaceholder = document.querySelector(".trailer-placeholder")
  trailerPlaceholder.innerHTML = ""

  if (trailer) {
    const thumbUrl = `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`
    const img = document.createElement("img")
    img.src = thumbUrl
    img.alt = "Trailer"
    const playBtn = document.createElement("div")
    playBtn.className = "play-btn"
    playBtn.textContent = "▶"
    trailerPlaceholder.appendChild(playBtn)
    trailerPlaceholder.appendChild(img)
    trailerPlaceholder.onclick = () => {
      const iframe = document.createElement("iframe")
      iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1`
      iframe.width = "100%"
      iframe.height = "100%"
      iframe.style.border = "none"
      iframe.allowFullscreen = true
      iframe.allow = "autoplay"
      trailerPlaceholder.innerHTML = ""
      trailerPlaceholder.appendChild(iframe)
    }
  }

  document.getElementById("popup-title").innerText = detail.title
  document.getElementById("popup-tagline").innerText = detail.tagline
  document.getElementById("popup-overview").innerText = detail.overview

  const chipsEl = document.getElementById("popup-chips")
  chipsEl.innerHTML = ""

  const year = document.createElement("span")
  year.className = "p-chips"
  year.textContent = detail.release_date.slice(0, 4)

  const runtime = document.createElement("span")
  runtime.className = "p-chip"
  runtime.textContent = Math.floor(detail.runtime / 60) + "h " + (detail.runtime % 60) + "m"

  const rating = document.createElement("span")
  rating.className = "p-chip-rating"
  rating.textContent = "⭐ " + detail.vote_average.toFixed(1) + "/10 (" + detail.vote_count + " votes)"

  chipsEl.appendChild(year)
  chipsEl.appendChild(runtime)
  chipsEl.appendChild(rating)

  const castEl = document.getElementById("popup-cast")
  castEl.innerHTML = ""
  credits.cast.slice(0, 10).forEach(actor => {
    const card = document.createElement("div")
    card.className = "cast-card"
    const photo = document.createElement("img")
    photo.className = "cast-photo"
    photo.src = "https://image.tmdb.org/t/p/w185" + actor.profile_path
    photo.alt = actor.name
    const name = document.createElement("span")
    name.className = "cast-name"
    name.textContent = actor.name
    const character = document.createElement("span")
    character.className = "cast-character"
    character.textContent = actor.character
    card.appendChild(photo)
    card.appendChild(name)
    card.appendChild(character)
    castEl.appendChild(card)
  })

  const extraEl = document.getElementById("popup-extra-details")
  extraEl.innerHTML = ""
  const rows = [
    ["Director", credits.crew.find(p => p.job === "Director")?.name || "N/A", true],
    ["Writer", credits.crew.find(p => p.job === "Writer" || p.job === "Screenplay")?.name || "N/A", true],
    ["Release", detail.release_date || "N/A", false],
    ["Runtime", Math.floor(detail.runtime / 60) + "h " + (detail.runtime % 60) + "m", false],
    ["Budget", detail.budget ? "$" + detail.budget.toLocaleString() : "N/A", false],
    ["Revenue", detail.revenue ? "$" + detail.revenue.toLocaleString() : "N/A", false],
    ["Status", detail.status || "N/A", false],
    ["Language", detail.original_language.toUpperCase(), false],
  ]
  rows.forEach(([key, val, isRed]) => {
    const keyEl = document.createElement("span")
    keyEl.className = "pd-key"
    keyEl.textContent = key
    const valEl = document.createElement("span")
    valEl.className = isRed ? "pd-val red" : "pd-val"
    valEl.textContent = val
    extraEl.appendChild(keyEl)
    extraEl.appendChild(valEl)
  })

  const releaseDate = new Date(detail.release_date)
  const options = { day: "numeric", month: "long", year: "numeric" }
  document.getElementById("popup-release-date").textContent = releaseDate.toLocaleDateString("en-us", options).toUpperCase()

  const banner = document.getElementById("popup-release-banner")
  banner.style.backgroundImage = `url(${heroUrl}${detail.backdrop_path})`
  banner.style.backgroundSize = "cover"
  banner.style.backgroundPosition = "center"

  const similarEl = document.getElementById("popup-similar")
  similarEl.innerHTML = ""
  similar.results.forEach(movie => {
    const card = document.createElement("div")
    card.className = "similar-card"
    card.onclick = () => openPop(movie.id)
    const poster = document.createElement("img")
    poster.className = "similar-poster"
    poster.src = imgUrl + movie.poster_path
    poster.alt = movie.title
    const title = document.createElement("span")
    title.className = "similar-title"
    title.textContent = movie.title
    const year = document.createElement("span")
    year.className = "similar-year"
    year.textContent = movie.release_date?.slice(0, 4)
    card.appendChild(poster)
    card.appendChild(title)
    card.appendChild(year)
    similarEl.appendChild(card)
  })
  console.log("Total similar results:", similar.results.length)  // ← yahan
  console.log(similar.results)
}