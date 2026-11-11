const STORAGE_KEY = "manager-lab-state-v1";
const languageButtons = [...document.querySelectorAll("[data-language]")];
const languageRoot = document.documentElement;
const scenarioCards = [...document.querySelectorAll(".scenario-card")];
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");
const progressSteps = [...document.querySelectorAll("[data-progress-step]")];
const pollResult = document.querySelector("#poll-result");
const copyStatus = document.querySelector("#copy-status");
const scrollProgressBar = document.querySelector("#scroll-progress-bar");

const languageLabels = {
  both: "双语 / Bilingual",
  zh: "中文",
  en: "English"
};

const voteLabels = {
  1: {
    zh: "机遇大于风险",
    en: "Opportunities outweigh risks"
  },
  2: {
    zh: "风险大于机遇",
    en: "Risks outweigh opportunities"
  },
  3: {
    zh: "取决于管理者的设计与支持",
    en: "It depends on managerial design and support"
  }
};

const choiceLabels = {
  1: {
    1: { zh: "思路 A：继续鼓励使用 AI", en: "Perspective A: Keep encouraging AI use" },
    2: { zh: "思路 B：交付前讲解代码逻辑", en: "Perspective B: Require code explanation before delivery" },
    3: { zh: "思路 C：安排阶段性无 AI 练习", en: "Perspective C: Assign periodic no-AI practice" }
  },
  2: {
    1: { zh: "思路 A：落实使用限制", en: "Perspective A: Enforce usage restrictions" },
    2: { zh: "思路 B：增加评审与校验流程", en: "Perspective B: Add review and validation" },
    3: { zh: "思路 C：区分场景使用 AI", en: "Perspective C: Use AI selectively" }
  },
  3: {
    1: { zh: "思路 A：优先安排常规任务", en: "Perspective A: Prioritise routine work" },
    2: { zh: "思路 B：提供带支架的挑战", en: "Perspective B: Assign scaffolded challenges" },
    3: { zh: "思路 C：硬性分配高难度任务", en: "Perspective C: Mandate difficult assignments" }
  }
};

const initialState = {
  language: "both",
  choices: {},
  vote: null
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      ...initialState,
      ...saved,
      choices: saved?.choices && typeof saved.choices === "object" ? saved.choices : {}
    };
  } catch {
    return { ...initialState, choices: {} };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The simulation remains fully usable when storage is unavailable.
  }
}

function setLanguage(language) {
  const safeLanguage = ["both", "zh", "en"].includes(language) ? language : "both";
  state.language = safeLanguage;
  languageRoot.dataset.lang = safeLanguage;
  languageRoot.lang = safeLanguage === "en" ? "en" : "zh-CN";

  languageButtons.forEach((button) => {
    const active = button.dataset.language === safeLanguage;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
    button.title = languageLabels[button.dataset.language];
  });

  saveState();
}

function selectChoice(stage, choice) {
  state.choices[stage] = choice;
  saveState();

  const card = document.querySelector(`.scenario-card[data-stage="${stage}"]`);
  card.querySelectorAll("[data-choice]").forEach((button) => {
    const selected = Number(button.dataset.choice) === choice;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  card.querySelectorAll("[data-feedback-choice]").forEach((feedback) => {
    feedback.classList.toggle("is-visible", feedback.dataset.feedbackChoice === `${stage}-${choice}`);
  });

  const feedback = card.querySelector(`[data-feedback="${stage}"]`);
  const feedbackTitle = feedback.querySelector(`[data-feedback-title="${stage}"]`);
  feedbackTitle.innerHTML = `
    <span class="lang-zh">${choiceLabels[stage][choice].zh}</span>
    <span class="lang-en">${choiceLabels[stage][choice].en}</span>
  `;
  applyInlineLanguage(feedbackTitle);
  feedback.classList.add("is-visible");
  updateProgress();
}

function applyInlineLanguage(container) {
  // CSS controls every generated label through the root language attribute.
  container.dataset.dynamicLanguage = "true";
}

function updateProgress() {
  const completed = Object.keys(state.choices).length;
  progressLabel.textContent = `${completed} / 3`;
  progressBar.style.width = `${(completed / 3) * 100}%`;

  progressSteps.forEach((step) => {
    step.classList.toggle("is-complete", Boolean(state.choices[step.dataset.progressStep]));
  });

  scenarioCards.forEach((card) => {
    card.classList.toggle("is-decided", Boolean(state.choices[card.dataset.stage]));
  });
}

function setVote(vote) {
  state.vote = vote;
  saveState();

  document.querySelectorAll("[data-vote]").forEach((button) => {
    const selected = Number(button.dataset.vote) === vote;
    button.classList.toggle("is-selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });

  const label = voteLabels[vote];
  pollResult.innerHTML = `
    <span class="lang-zh">你的选择：${label.zh}</span>
    <span class="lang-en">Your choice: ${label.en}</span>
  `;
  pollResult.style.display = "flex";
  applyInlineLanguage(pollResult);
}

function restoreState() {
  setLanguage(state.language);
  updateProgress();

  Object.entries(state.choices).forEach(([stage, choice]) => {
    if (choiceLabels[stage]?.[choice]) {
      selectChoice(Number(stage), Number(choice));
    }
  });

  if (state.vote && voteLabels[state.vote]) {
    setVote(Number(state.vote));
  }
}

function scrollToStage(stage) {
  const target = document.querySelector(`.scenario-card[data-stage="${stage}"]`);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearSimulation() {
  state = { ...initialState, language: state.language, choices: {} };
  saveState();

  document.querySelectorAll("[data-choice]").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });

  document.querySelectorAll("[data-feedback]").forEach((feedback) => {
    feedback.classList.remove("is-visible");
  });

  document.querySelectorAll("[data-feedback-choice]").forEach((feedbackChoice) => {
    feedbackChoice.classList.remove("is-visible");
  });

  document.querySelectorAll("[data-vote]").forEach((button) => {
    button.classList.remove("is-selected");
    button.setAttribute("aria-pressed", "false");
  });

  pollResult.textContent = "";
  pollResult.style.display = "none";
  copyStatus.textContent = "";
  updateProgress();
  document.querySelector("#simulation").scrollIntoView({ behavior: "smooth" });
}

function buildSummaryText() {
  const lines = [
    "YOU'RE THE MANAGER / 你就是管理者",
    ""
  ];

  for (const stage of [1, 2, 3]) {
    const choice = state.choices[stage];
    lines.push(
      choice
        ? `Act ${stage}: ${choiceLabels[stage][choice].zh} / ${choiceLabels[stage][choice].en}`
        : `Act ${stage}: Not decided / 尚未选择`
    );
  }

  lines.push("");
  lines.push(
    state.vote
      ? `Final vote: ${voteLabels[state.vote].zh} / ${voteLabels[state.vote].en}`
      : "Final vote: Not recorded / 尚未投票"
  );
  lines.push("");
  lines.push("AI is a tool. Growth has to be designed. / AI 是工具。成长，需要被设计。");

  return lines.join("\n");
}

async function copySummary() {
  const text = buildSummaryText();

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = languageRoot.dataset.lang === "en"
      ? "Copied to clipboard."
      : languageRoot.dataset.lang === "zh"
        ? "已复制到剪贴板。"
        : "已复制 / Copied.";
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
    copyStatus.textContent = languageRoot.dataset.lang === "en"
      ? "Copied to clipboard."
      : languageRoot.dataset.lang === "zh"
        ? "已复制到剪贴板。"
        : "已复制 / Copied.";
  }
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

scenarioCards.forEach((card) => {
  const stage = Number(card.dataset.stage);
  card.querySelectorAll("[data-choice]").forEach((button) => {
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectChoice(stage, Number(button.dataset.choice)));
  });

  card.querySelector("[data-next]")?.addEventListener("click", (event) => {
    scrollToStage(Number(event.currentTarget.dataset.next));
  });
});

document.querySelectorAll("[data-vote]").forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", () => setVote(Number(button.dataset.vote)));
});

document.querySelector("#copy-summary").addEventListener("click", copySummary);
document.querySelector("#restart").addEventListener("click", clearSimulation);

function updateScrollProgress() {
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 0;
  scrollProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress);

const revealTargets = [
  ...document.querySelectorAll(".scenario-card, .principle-card, .timeline-row")
];

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  revealTargets.forEach((element) => {
    element.style.opacity = "0";
    element.style.transform = "translateY(16px)";
    element.style.transition = "opacity 500ms ease, transform 500ms ease";
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06 });

  revealTargets.forEach((element) => revealObserver.observe(element));
}

restoreState();
updateScrollProgress();
