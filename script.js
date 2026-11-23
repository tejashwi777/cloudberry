
const STORAGE_KEY = "cloudberry-posts";
let posts = [];

try {
  posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
} catch {
  posts = [];
}

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[c]);
}

// NAVIGATION
function showPage(page) {
  document.querySelectorAll(".page").forEach(el =>
    el.classList.remove("active")
  );
  document.getElementById(page).classList.add("active");

  document.querySelectorAll(".nav-link").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.page === page)
  );

  if (page === "wall") renderWall();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

// NOTIFICATIONS
let toastTimeout;

function notify(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

// CONFESSION FORM
const confession = document.getElementById("confession");
const counter = document.getElementById("counter");

confession.addEventListener("input", () => {
  counter.textContent = `${confession.value.length} / 500`;
});

document.getElementById("submitConfession").addEventListener("click", () => {
  const text = confession.value.trim();

  if (!text) {
    notify("Write a little something first.");
    return;
  }

  if (text.length > 500) {
    notify("Your confession is too long.");
    return;
  }

  const post = {
    id: crypto.randomUUID(),
    text,
    category: document.getElementById("category").value,
    likes: 0,
    replies: [],
    time: Date.now()
  };

  posts.unshift(post);
  savePosts();

  confession.value = "";
  counter.textContent = "0 / 500";

  notify("Your little secret has been saved.");
  showPage("wall");
});

// CONFESSION WALL
const wallPosts = document.getElementById("wallPosts");
const search = document.getElementById("search");
const filter = document.getElementById("filter");

search.addEventListener("input", renderWall);
filter.addEventListener("change", renderWall);

function timeAgo(time) {
  const minutes = Math.floor((Date.now() - time) / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  return `${Math.floor(hours / 24)} days ago`;
}

function renderWall() {
  const query = search.value.toLowerCase();
  const selected = filter.value;

  const visible = posts.filter(post => {
    const matchesCategory =
      selected === "All" || post.category === selected;

    const matchesSearch =
      post.text.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  if (!visible.length) {
    wallPosts.innerHTML = `
      <div class="empty-state">
        Nothing here just yet.<br>
        Perhaps your whisper could be the first.
      </div>`;
    return;
  }

  wallPosts.innerHTML = visible.map(post => `
    <article class="post">
      <div class="post-category">
        ${escapeHTML(post.category)}
      </div>

      <div class="post-text">${escapeHTML(post.text)}</div>

      <div class="post-meta">
        anonymous · ${timeAgo(post.time)}
      </div>

      <div class="post-actions">
        <button onclick="likePost('${post.id}')">
          ♡ ${post.likes} hearts
        </button>

        <button onclick="toggleReply('${post.id}')">
          ↳ ${post.replies.length} replies
        </button>

        <button onclick="reportPost('${post.id}')">
          Report
        </button>
      </div>

      <div class="replies">
        ${post.replies.map(reply => `
          <div class="reply">
            <div class="post-meta">ANONYMOUS REPLY</div>
            ${escapeHTML(reply.text)}
          </div>
        `).join("")}
      </div>

      <form class="reply-form" id="reply-${post.id}"
        style="display:none"
        onsubmit="addReply(event,'${post.id}')">

        <input maxlength="200" required
          placeholder="Write a kind reply...">

        <button type="submit">Send ↗</button>
      </form>
    </article>
  `).join("");
}

// HEART REACTIONS
function likePost(id) {
  const post = posts.find(p => p.id === id);
  if (!post) return;

  let liked = JSON.parse(
    localStorage.getItem("cloudberry-likes") || "[]"
  );

  if (liked.includes(id)) {
    liked = liked.filter(x => x !== id);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    liked.push(id);
    post.likes++;
  }

  localStorage.setItem("cloudberry-likes", JSON.stringify(liked));
  savePosts();
  renderWall();
}

// REPLIES
function toggleReply(id) {
  const form = document.getElementById("reply-" + id);
  form.style.display =
    form.style.display === "none" ? "flex" : "none";
}

function addReply(event, id) {
  event.preventDefault();

  const post = posts.find(p => p.id === id);
  if (!post) return;

  const input = event.target.querySelector("input");
  const text = input.value.trim();

  if (!text) return;

  post.replies.push({ text });
  savePosts();
  renderWall();
  notify("Your reply has been added.");
}

// REPORTING
function reportPost(id) {
  const confirmed = confirm(
    "Report this confession for review?"
  );

  if (!confirmed) return;

  let reports = JSON.parse(
    localStorage.getItem("cloudberry-reports") || "[]"
  );

  if (!reports.includes(id)) reports.push(id);

  localStorage.setItem(
    "cloudberry-reports",
    JSON.stringify(reports)
  );

  notify("Report recorded in this browser demo.");
}

// WOULD YOU RATHER
const wouldYouRather = [
  ["Live in a world where it is always spring or always autumn?",
   "Always spring", "Always autumn"],

  ["Receive a handwritten love letter or a surprise bouquet?",
   "Love letter", "Surprise bouquet"],

  ["Live in a tiny cottage by the sea or a house in the clouds?",
   "Cottage by the sea", "House in the clouds"],

  ["Know everyone's thoughts or know everyone's dreams?",
   "Read thoughts", "See dreams"],

  ["Travel everywhere with your best friend or your favourite person?",
   "Best friend", "Favourite person"],

  ["Have a perfect memory or forget every embarrassing moment?",
   "Perfect memory", "Forget embarrassment"],

  ["Watch the sunrise or watch the stars?",
   "Sunrise", "Stars"],

  ["Find a letter from your future self or your past self?",
   "Future self", "Past self"]
];

let wyrIndex = 0;
let wyrChoices = [];

function startWYR() {
  wyrIndex = 0;
  wyrChoices = [];
  renderWYR();
}

function renderWYR() {
  const area = document.getElementById("gameArea");

  if (wyrIndex >= wouldYouRather.length) {
    area.innerHTML = `
      <div class="game-symbol">✳</div>
      <h2>That was fun.</h2>
      <p class="game-note">
        You made ${wyrChoices.length} little choices.
        There are no wrong answers here.
      </p>
      <button class="primary-btn" onclick="startWYR()">
        Play again ↻
      </button>`;
    return;
  }

  const question = wouldYouRather[wyrIndex];

  area.innerHTML = `
    <span class="eyebrow">WOULD YOU RATHER?</span>
    <p class="game-note">
      QUESTION ${wyrIndex + 1} OF ${wouldYouRather.length}
    </p>

    <div class="game-question">${question[0]}</div>

    <button class="game-choice" onclick="answerWYR(0)">
      ${question[1]}
    </button>

    <div class="game-note">OR</div>

    <button class="game-choice" onclick="answerWYR(1)">
      ${question[2]}
    </button>

    <p class="game-note">Choose what feels right.</p>
  `;
}

function answerWYR(choice) {
  wyrChoices.push(choice);
  wyrIndex++;
  renderWYR();
}

// PERSONALITY QUIZ
const quizQuestions = [
  {
    q: "What does your perfect afternoon look like?",
    a: ["Reading by the window", "Exploring somewhere new",
        "Talking with friends", "Making something creative"]
  },
  {
    q: "Choose a place to escape to.",
    a: ["A quiet beach", "A busy city", "A magical forest",
        "A cosy mountain cabin"]
  },
  {
    q: "Which describes you best?",
    a: ["Thoughtful", "Adventurous", "Caring", "Imaginative"]
  },
  {
    q: "Pick your favourite little treat.",
    a: ["Strawberry cake", "Iced coffee", "Chocolate cookies",
        "Vanilla ice cream"]
  },
  {
    q: "What do you value most?",
    a: ["Peace", "Freedom", "Connection", "Creativity"]
  }
];

const quizResults = [
  {
    title: "The Dreamer",
    symbol: "01",
    description:
      "You have a gentle imagination and a world of thoughts inside you. You find magic in the little things and dream of beautiful possibilities."
  },
  {
    title: "The Explorer",
    symbol: "02",
    description:
      "You are curious, independent and always looking for something new. You believe life is too interesting to stay in one place."
  },
  {
    title: "The Romantic",
    symbol: "03",
    description:
      "You care deeply about people and meaningful moments. You notice the little details and make people feel appreciated."
  },
  {
    title: "The Creator",
    symbol: "04",
    description:
      "You see the world a little differently. Your imagination is your superpower, and you have a beautiful way of expressing yourself."
  }
];

let quizIndex = 0;
let quizAnswers = [];

function startQuiz() {
  quizIndex = 0;
  quizAnswers = [];
  renderQuiz();
}

function renderQuiz() {
  const area = document.getElementById("gameArea");

  if (quizIndex >= quizQuestions.length) {
    showQuizResult();
    return;
  }

  const question = quizQuestions[quizInde];

  area.innerHTML = `
    <span class="eyebrow">A LITTLE PERSONALITY QUIZ</span>
    <p class="game-note">
      QUESTION ${quizIndex + 1} OF ${quizQuestions.length}
    </p>

    <div class="game-question">${question.q}</div>

    ${question.a.map((answer, index) => `
      <button class="game-choice"
        onclick="answerQuiz(${index})">
        ${answer}
      </button>
    `).join("")}

    <p class="game-note">Choose what feels most like you.</p>
  `;
}

function answerQuiz(index) {
  quizAnswers.push(index);
  quizIndex++;
  renderQuiz();
}

function showQuizResult() {
  const counts = [0, 0, 0, 0];

  quizAnswers.forEach(answer => counts[answer]++);

  const max = Math.max(...counts);
  const winner = counts.indexOf(max);
  const result = quizResults[winner];

  document.getElementById("gameArea").innerHTML = `
    <span class="eyebrow">YOUR LITTLE RESULT</span>
    <div class="game-symbol">${result.symbol}</div>
    <h2>${result.title}</h2>
    <p style="line-height:1.9;font-size:13px">
      ${result.description}
    </p>
    <p class="game-note">
      Just a bit of fun, not a scientific personality assessment.
    </p>
    <button class="primary-btn" onclick="startQuiz()">
      Take it again ↻
    </button>
  `;
}

// GAME TABS
document.querySelectorAll(".game-tab").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".game-tab").forEach(tab =>
      tab.classList.remove("active")
    );

    button.classList.add("active");

    if (button.dataset.game === "wyr") {
      startWYR();
    } else {
      startQuiz();
    }
  });
});

// INITIAL DISPLAY
renderWall();
