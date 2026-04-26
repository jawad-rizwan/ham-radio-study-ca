const DATA_PATHS = {
  questions: "data/questions.json",
  topics: "data/topics.json",
  explanations: "data/explanations.json",
  guide: "data/guide.json",
  course: "data/course.json",
  reference: "data/reference.json",
  formulas: "data/formulas.json",
  flashcards: "data/flashcards.json",
};

const PROGRESS_KEY = "hamRadioStudyProgress:v1";
const THEME_KEY = "hamRadioStudyTheme";
const APP_VERSION = "1.2.0";

const app = document.querySelector("#app");
const navLinks = [...document.querySelectorAll("[data-view]")];

const state = {
  data: null,
  view: "dashboard",
  session: null,
  reviewSession: null,
  bank: {
    query: "",
    major: "all",
    section: "all",
    bookmarkedOnly: false,
    limit: 80,
  },
  guide: {
    moduleId: "",
  },
  course: {
    unitId: "",
    activeUnitId: "",
    activeStartedAt: 0,
  },
  reference: {
    query: "",
    topic: "all",
  },
  formula: {
    index: 0,
    selected: null,
  },
  flashcards: {
    deckId: "",
    cards: [],
    index: 0,
    flipped: false,
    mode: "smart",
  },
  progress: loadProgress(),
};

applyTheme(loadTheme());

function loadTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Theme storage is optional.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = document.querySelector("[data-action='toggle-theme']");
  if (button) button.textContent = theme === "dark" ? "Light" : "Dark";
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Non-critical.
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function defaultProgress() {
  return {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    questionStats: {},
    examHistory: [],
    guideCompletions: {},
    courseProgress: {
      currentUnitId: "",
      units: {},
    },
    formulaStats: {},
    flashcardStats: {},
    bookmarks: [],
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return defaultProgress();
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return defaultProgress();
  }
}

function normalizeProgress(progress) {
  const base = defaultProgress();
  return {
    ...base,
    ...progress,
    questionStats: progress?.questionStats && typeof progress.questionStats === "object" ? progress.questionStats : {},
    examHistory: Array.isArray(progress?.examHistory) ? progress.examHistory : [],
    guideCompletions: progress?.guideCompletions && typeof progress.guideCompletions === "object" ? progress.guideCompletions : {},
    courseProgress: normalizeCourseProgress(progress?.courseProgress),
    formulaStats: progress?.formulaStats && typeof progress.formulaStats === "object" ? progress.formulaStats : {},
    flashcardStats: progress?.flashcardStats && typeof progress.flashcardStats === "object" ? progress.flashcardStats : {},
    bookmarks: Array.isArray(progress?.bookmarks) ? progress.bookmarks : [],
  };
}

function normalizeCourseProgress(progress) {
  return {
    currentUnitId: typeof progress?.currentUnitId === "string" ? progress.currentUnitId : "",
    units: progress?.units && typeof progress.units === "object" ? progress.units : {},
  };
}

function saveProgress() {
  state.progress.lastUpdated = new Date().toISOString();
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
  } catch {
    alert("Progress could not be saved. Site storage may be disabled or full.");
  }
}

function exportProgress() {
  const blob = new Blob([JSON.stringify(state.progress, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ham-radio-study-progress-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function importProgress(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      state.progress = normalizeProgress(JSON.parse(reader.result));
      saveProgress();
      render();
      alert("Progress imported.");
    } catch {
      alert("That file does not look like a valid HAM Radio Study progress backup.");
    }
  });
  reader.readAsText(file);
}

function resetProgress() {
  if (!confirm("Reset all saved progress on this device? This cannot be undone.")) return;
  state.progress = defaultProgress();
  saveProgress();
  render();
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDuration(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}

function setView(view) {
  settleCourseTime();
  state.view = view;
  if (view !== "guide") state.guide.moduleId = "";
  state.course.unitId = "";
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === view));
  render();
  app.focus();
  window.location.hash = view;
}

function getQuestionById(id) {
  return state.data.questions.find((question) => question.id === id);
}

function getSectionById(id) {
  return state.data.sectionsById[id];
}

function getMajorById(id) {
  return state.data.majorById[id];
}

function getMajorBySlug(slug) {
  return state.data.majorTopics.find((topic) => topic.slug === slug);
}

function explanationFor(question) {
  return state.data.explanations[question.id] || {
    summary: `The official answer is "${question.correct_answer || question.choices[question.correct_index]}".`,
    detail: "Review the related syllabus topic and compare the wording of the question with the official answer.",
    wrong_answer_guidance: "The selected distractor is not the official answer for this exact question.",
    guide_module: question.major_slug,
  };
}

function bookmarked(id) {
  return state.progress.bookmarks.includes(id);
}

function toggleBookmark(id) {
  state.progress.bookmarks = bookmarked(id)
    ? state.progress.bookmarks.filter((item) => item !== id)
    : [...state.progress.bookmarks, id];
  saveProgress();
  render();
}

function getStats() {
  const questionStats = Object.values(state.progress.questionStats);
  const attempts = questionStats.reduce((sum, item) => sum + (item.attempts || 0), 0);
  const correct = questionStats.reduce((sum, item) => sum + (item.correct || 0), 0);
  const mockExams = state.progress.examHistory.filter((record) => record.mode === "mock");
  const recentMocks = mockExams.slice(-3);
  const mockAverage = recentMocks.length
    ? recentMocks.reduce((sum, record) => sum + record.scorePercent, 0) / recentMocks.length
    : 0;
  const sectionsTouched = new Set(
    state.data.questions
      .filter((question) => state.progress.questionStats[question.id]?.attempts)
      .map((question) => question.section_id),
  ).size;
  return {
    attempts,
    correct,
    accuracy: attempts ? round1((correct / attempts) * 100) : 0,
    mockCount: mockExams.length,
    mockAverage: round1(mockAverage),
    bestMock: mockExams.length ? Math.max(...mockExams.map((record) => record.scorePercent)) : 0,
    sectionsTouched,
    guideDone: Object.keys(state.progress.guideCompletions).length,
    courseDone: state.data.course.units.filter((unit) => getUnitProgress(unit.id).completedAt).length,
  };
}

function readinessScore() {
  const stats = getStats();
  const topicCoverage = (stats.sectionsTouched / state.data.sections.length) * 100;
  const guideCoverage = (stats.guideDone / state.data.guide.modules.length) * 100;
  const courseCoverage = (stats.courseDone / state.data.course.units.length) * 100;
  const mockWeight = stats.mockCount ? stats.mockAverage : 0;
  return round1((mockWeight * 0.48) + (stats.accuracy * 0.22) + (topicCoverage * 0.14) + (guideCoverage * 0.08) + (courseCoverage * 0.08));
}

function readinessLabel(score) {
  if (score >= 85) return "Honours-ready";
  if (score >= 75) return "Near exam-ready";
  if (score >= 55) return "Building";
  return "Early stage";
}

function sectionMastery(sectionId) {
  const questions = state.data.questionsBySection[sectionId] || [];
  const stats = questions.map((question) => state.progress.questionStats[question.id]).filter(Boolean);
  const attempts = stats.reduce((sum, item) => sum + (item.attempts || 0), 0);
  const correct = stats.reduce((sum, item) => sum + (item.correct || 0), 0);
  return {
    attempts,
    correct,
    percent: attempts ? round1((correct / attempts) * 100) : 0,
    seen: stats.length,
    total: questions.length,
  };
}

function majorMastery(majorId) {
  const sections = state.data.sections.filter((section) => section.major_id === majorId);
  const values = sections.map((section) => sectionMastery(section.id));
  const attempts = values.reduce((sum, item) => sum + item.attempts, 0);
  const correct = values.reduce((sum, item) => sum + item.correct, 0);
  const seenQuestions = values.reduce((sum, item) => sum + item.seen, 0);
  const totalQuestions = values.reduce((sum, item) => sum + item.total, 0);
  return {
    attempts,
    correct,
    percent: attempts ? round1((correct / attempts) * 100) : 0,
    seenQuestions,
    totalQuestions,
  };
}

function weakSections(limit = 8) {
  return state.data.sections
    .map((section) => ({ section, mastery: sectionMastery(section.id) }))
    .sort((a, b) => {
      const aScore = a.mastery.attempts ? a.mastery.percent : -1;
      const bScore = b.mastery.attempts ? b.mastery.percent : -1;
      if (aScore !== bScore) return aScore - bScore;
      return a.mastery.seen - b.mastery.seen;
    })
    .slice(0, limit);
}

function officialExamStatus(score) {
  if (score >= 80) return "Basic with Honours range";
  if (score >= 70) return "Pass range";
  return "Below pass mark";
}

function hero(title, body, eyebrow = "") {
  return `
    <section class="page-head">
      ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ""}
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(body)}</p>
    </section>
  `;
}

function statCard(label, value, detail = "") {
  return `
    <article class="stat-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${detail ? `<small>${escapeHtml(detail)}</small>` : ""}
    </article>
  `;
}

function render() {
  if (!state.data) {
    app.innerHTML = `
      <section class="loading-card">
        <p class="eyebrow">Loading study material</p>
        <h1>Preparing the official question bank...</h1>
      </section>
    `;
    return;
  }

  const views = {
    dashboard: renderDashboard,
    quickStart: renderQuickStart,
    course: renderCourse,
    guide: renderGuide,
    practice: renderPractice,
    exam: renderPractice,
    formulas: renderFormulas,
    bank: renderQuestionBank,
    flashcards: renderFlashcards,
    cram: renderCramSheets,
    resources: renderResources,
    nextSteps: renderNextSteps,
    progress: renderProgress,
    about: renderAbout,
  };
  app.innerHTML = (views[state.view] || renderDashboard)();
}

function renderDashboard() {
  const stats = getStats();
  const readiness = readinessScore();
  const weak = weakSections(5);
  const currentUnit = getCurrentCourseUnit();
  return `
    ${hero("Canadian Amateur Radio Basic study workspace", "Study the official government question bank, drill weak topics, and track your path to the 70 percent pass mark and 80 percent honours threshold.", "Dashboard")}
    <section class="grid four">
      ${statCard("Readiness", `${readiness}%`, readinessLabel(readiness))}
      ${statCard("Mock exams", stats.mockCount, stats.mockCount ? `Best ${stats.bestMock}%` : "Start with one")}
      ${statCard("Question accuracy", `${stats.accuracy}%`, `${stats.attempts} attempts`)}
      ${statCard("Topic coverage", `${stats.sectionsTouched}/100`, "RIC-3 topic areas")}
    </section>
    <section class="dashboard-layout">
      <div>
        <article class="panel radio-panel">
          <div>
            <p class="eyebrow">Official bank</p>
            <h2>984 questions from the Government of Canada bank</h2>
            <p class="muted">Mock exams draw one question from each of the 100 Basic topic areas, matching the RIC-3 exam structure.</p>
            <div class="actions">
              <button class="btn" type="button" data-view="quickStart">Start here</button>
              <button class="btn secondary" type="button" data-action="start-mock">Start 100-question mock</button>
              <button class="btn secondary" type="button" data-action="start-adaptive">Adaptive study</button>
              <button class="btn ghost" type="button" data-view="course">Open course</button>
            </div>
          </div>
          <div class="signal-visual" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </article>
        <section class="grid two" style="margin-top: 16px;">
          <article class="panel">
            <h2>Course path</h2>
            <p class="muted">${stats.courseDone}/${state.data.course.units.length} units complete${currentUnit ? ` | Next: ${currentUnit.order}. ${currentUnit.title}` : ""}.</p>
            <button class="btn secondary" type="button" data-action="resume-course">${currentUnit ? "Resume course" : "Start course"}</button>
          </article>
          <article class="panel">
            <h2>Formula practice</h2>
            <p class="muted">Focused drills for Ohm's law, power, wavelength, dB, batteries and reactance.</p>
            <button class="btn secondary" type="button" data-view="formulas">Practice formulas</button>
          </article>
          <article class="panel">
            <h2>Next steps</h2>
            <p class="muted">Official practice exam, accredited examiner search, and exam-readiness checklist.</p>
            <button class="btn secondary" type="button" data-view="nextSteps">Plan exam booking</button>
          </article>
        </section>
      </div>
      <aside class="panel">
        <h2>Weakest topic areas</h2>
        <div class="stack">
          ${weak.map(({ section, mastery }) => `
            <article class="mini-row">
              <div>
                <strong>${escapeHtml(section.number)} ${escapeHtml(section.title)}</strong>
                <small>${escapeHtml(getMajorById(section.major_id).short_title)} | ${mastery.attempts ? `${mastery.percent}%` : "Not started"}</small>
              </div>
              <button class="btn small ghost" type="button" data-action="practice-section" data-section-id="${escapeHtml(section.id)}">Drill</button>
            </article>
          `).join("")}
        </div>
      </aside>
    </section>
  `;
}

function renderQuickStart() {
  const stats = getStats();
  const currentUnit = getCurrentCourseUnit();
  return `
    ${hero("Start here", "A simple order for using the site without getting lost. Follow this path first, then use the extra tools only when they help.", "Quick Start")}
    <section class="panel start-panel">
      <div>
        <p class="eyebrow">Recommended routine</p>
        <h2>Do one course unit, then drill it</h2>
        <p class="muted">Most sessions should be simple: open the next course unit, read the tasks, review the related guide notes, drill the official questions, then mark the unit complete.</p>
      </div>
      <div class="actions">
        <button class="btn" type="button" data-action="resume-course">${currentUnit ? `Continue unit ${currentUnit.order}` : "Start course"}</button>
        <button class="btn secondary" type="button" data-view="progress">Check progress</button>
      </div>
    </section>
    <section class="quick-path">
      ${renderQuickStep("1", "Get oriented", "Open this page when you feel lost. The site is built around the Course Path; everything else supports it.", "Dashboard, Start Here", `<button class="btn small secondary" type="button" data-view="dashboard">Open dashboard</button>`)}
      ${renderQuickStep("2", "Work through Course Path in order", "Use the 28 units as your main study plan. Each unit maps to official topic areas and exact question-bank sections.", `${stats.courseDone}/${state.data.course.units.length} units complete`, `<button class="btn small" type="button" data-action="resume-course">Continue course</button>`)}
      ${renderQuickStep("3", "Read only what supports the current unit", "Use the Study Guide when a course unit points you there. Avoid trying to read the entire site at once.", "Study Guide", `<button class="btn small secondary" type="button" data-view="guide">Open guide</button>`)}
      ${renderQuickStep("4", "Drill immediately after studying", "After each unit, use its Drill button. Wrong answers show detailed explanations, and those misses feed adaptive review.", "Practice", `<button class="btn small secondary" type="button" data-view="practice">Open practice</button>`)}
      ${renderQuickStep("5", "Use Formula Drills and Flashcards as side tools", "Do formula drills for math-heavy units. Use flashcards for callsigns, Q signals, privileges, safety facts and definitions.", "Formulas, Flashcards", `<button class="btn small secondary" type="button" data-view="formulas">Formula drills</button><button class="btn small ghost" type="button" data-view="flashcards">Flashcards</button>`)}
      ${renderQuickStep("6", "Switch to adaptive review after you have attempts", "Once you have answered a few hundred questions, adaptive study becomes useful because it targets weak, missed, stale and unseen questions.", `${stats.attempts} attempts`, `<button class="btn small secondary" type="button" data-action="start-adaptive">Adaptive study</button>`)}
      ${renderQuickStep("7", "Take mocks when you are ready to measure", "Use 100-question mock exams after you have covered a good chunk of the course. Aim for repeated 80%+ scores before booking.", `${stats.mockCount} mocks taken`, `<button class="btn small secondary" type="button" data-action="start-mock">Start mock</button>`)}
      ${renderQuickStep("8", "Use Next Steps near the end", "When mocks are stable, use the official ISED practice exam and examiner links to move from studying to booking.", "Exam prep", `<button class="btn small secondary" type="button" data-view="nextSteps">Open next steps</button>`)}
    </section>
    <section class="grid two" style="margin-top: 16px;">
      <article class="panel">
        <h2>What to do in a 30-minute session</h2>
        <ol class="clean-list">
          <li>Spend 10 minutes reading the next course unit and related guide notes.</li>
          <li>Spend 15 minutes drilling that unit's official questions.</li>
          <li>Spend 5 minutes reviewing explanations for anything wrong and bookmarking fragile facts.</li>
        </ol>
      </article>
      <article class="panel">
        <h2>What to ignore at first</h2>
        <p class="muted">Do not start by browsing all 984 questions or taking repeated mocks cold. Those tools are useful later, but the Course Path gives you the clean structure.</p>
        <p class="muted">Use Cram Sheets and Resources as references, not as your main daily workflow.</p>
      </article>
    </section>
    <section class="panel" style="margin-top: 16px;">
      <h2>Which page does what?</h2>
      <div class="use-grid">
        ${renderUseCard("Course Path", "Main study plan. Use this most days.", "course")}
        ${renderUseCard("Study Guide", "Explanations and concepts behind the official topics.", "guide")}
        ${renderUseCard("Practice", "Mock exams, adaptive review, missed questions and custom drills.", "practice")}
        ${renderUseCard("Question Bank", "Search or inspect exact official questions.", "bank")}
        ${renderUseCard("Formula Drills", "Math practice for Ohm's law, power, wavelength, dB and reactance.", "formulas")}
        ${renderUseCard("Flashcards", "Fast memory review for rules, terms and facts.", "flashcards")}
        ${renderUseCard("Cram Sheets", "Printable last-pass summaries.", "cram")}
        ${renderUseCard("Progress", "Accuracy, weak areas, backups and reset.", "progress")}
      </div>
    </section>
  `;
}

function renderQuickStep(number, title, body, detail, actionHtml) {
  return `
    <article class="quick-step">
      <span class="course-number">${escapeHtml(number)}</span>
      <div>
        <h2>${escapeHtml(title)}</h2>
        <p class="muted">${escapeHtml(body)}</p>
        <div class="course-meta"><span>${escapeHtml(detail)}</span></div>
        <div class="actions">${actionHtml}</div>
      </div>
    </article>
  `;
}

function renderUseCard(title, body, view) {
  return `
    <button class="use-card" type="button" data-view="${escapeHtml(view)}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(body)}</span>
    </button>
  `;
}

function getUnitProgress(unitId) {
  return state.progress.courseProgress.units[unitId] || {
    elapsedSeconds: 0,
    completedAt: "",
    lastOpenedAt: "",
  };
}

function currentElapsedSeconds(unitId) {
  const progress = getUnitProgress(unitId);
  const activeSeconds = state.course.activeUnitId === unitId && state.course.activeStartedAt
    ? Math.floor((Date.now() - state.course.activeStartedAt) / 1000)
    : 0;
  return (progress.elapsedSeconds || 0) + activeSeconds;
}

function settleCourseTime() {
  if (!state.course.activeUnitId || !state.course.activeStartedAt) return;
  const unitId = state.course.activeUnitId;
  const elapsed = Math.max(0, Math.floor((Date.now() - state.course.activeStartedAt) / 1000));
  if (elapsed > 0) {
    const progress = getUnitProgress(unitId);
    state.progress.courseProgress.units[unitId] = {
      ...progress,
      elapsedSeconds: (progress.elapsedSeconds || 0) + elapsed,
      lastOpenedAt: new Date().toISOString(),
    };
    saveProgress();
  }
  state.course.activeUnitId = "";
  state.course.activeStartedAt = 0;
}

function resumeCourseTime() {
  if (!state.data || state.view !== "course" || !state.course.unitId || state.course.activeUnitId) return;
  const progress = getUnitProgress(state.course.unitId);
  state.progress.courseProgress.units[state.course.unitId] = {
    ...progress,
    lastOpenedAt: new Date().toISOString(),
  };
  state.course.activeUnitId = state.course.unitId;
  state.course.activeStartedAt = Date.now();
  saveProgress();
}

function getCurrentCourseUnit() {
  const saved = state.progress.courseProgress.currentUnitId;
  if (saved) return state.data.course.units.find((unit) => unit.id === saved) || state.data.course.units[0];
  return state.data.course.units.find((unit) => !getUnitProgress(unit.id).completedAt) || state.data.course.units[0];
}

function openCourseUnit(unitId) {
  settleCourseTime();
  const unit = state.data.course.units.find((item) => item.id === unitId);
  if (!unit) return;
  const progress = getUnitProgress(unitId);
  state.progress.courseProgress.currentUnitId = unitId;
  state.progress.courseProgress.units[unitId] = {
    ...progress,
    lastOpenedAt: new Date().toISOString(),
  };
  state.course.unitId = unitId;
  state.course.activeUnitId = unitId;
  state.course.activeStartedAt = Date.now();
  saveProgress();
  state.view = "course";
  navLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === "course"));
  render();
  app.focus();
  window.location.hash = "course";
}

function completeCourseUnit(unitId) {
  settleCourseTime();
  const progress = getUnitProgress(unitId);
  state.progress.courseProgress.units[unitId] = {
    ...progress,
    completedAt: new Date().toISOString(),
  };
  const next = state.data.course.units.find((unit) => unit.order > (state.data.course.units.find((item) => item.id === unitId)?.order || 0) && !getUnitProgress(unit.id).completedAt);
  state.progress.courseProgress.currentUnitId = next?.id || unitId;
  saveProgress();
  render();
}

function renderCourse() {
  if (state.course.unitId) return renderCourseUnit();
  const completed = state.data.course.units.filter((unit) => getUnitProgress(unit.id).completedAt).length;
  const current = getCurrentCourseUnit();
  return `
    ${hero("28-unit course path", "A smaller-step study route inspired by recommended Canadian Basic training sequences, mapped back to the official RIC-3 topic areas and our exact question bank.", "Course Path")}
    <section class="panel course-overview">
      <div>
        <h2>${completed}/${state.data.course.units.length} units complete</h2>
        <p class="muted">Resume at ${current.order}. ${escapeHtml(current.title)}. Time is saved locally whenever you open or leave a unit.</p>
      </div>
      <div class="actions">
        <button class="btn" type="button" data-action="resume-course">Resume</button>
        <button class="btn secondary" type="button" data-view="resources">Open resources</button>
        <button class="btn ghost" type="button" data-view="guide">Open 8-area guide</button>
      </div>
    </section>
    <section class="course-list">
      ${state.data.course.units.map(renderCourseUnitCard).join("")}
    </section>
  `;
}

function renderCourseUnitCard(unit) {
  const progress = getUnitProgress(unit.id);
  const done = Boolean(progress.completedAt);
  const questionCount = unit.section_ids.reduce((sum, sectionId) => sum + (state.data.questionsBySection[sectionId]?.length || 0), 0);
  return `
    <article class="course-card ${done ? "done" : ""}">
      <div class="course-number">${unit.order}</div>
      <div>
        <h2>${escapeHtml(unit.title)}</h2>
        <p class="muted">${escapeHtml(unit.description)}</p>
        <div class="course-meta">
          <span>${unit.section_ids.length} topic area(s)</span>
          <span>${questionCount} bank question(s)</span>
          <span>${formatDuration(progress.elapsedSeconds || 0)} studied</span>
          ${done ? `<span class="result-good">Complete</span>` : ""}
        </div>
        <div class="actions">
          <button class="btn small" type="button" data-action="open-course-unit" data-unit-id="${escapeHtml(unit.id)}">${done ? "Review" : "Open"}</button>
          <button class="btn small secondary" type="button" data-action="practice-course-unit" data-unit-id="${escapeHtml(unit.id)}">Drill</button>
        </div>
      </div>
    </article>
  `;
}

function renderCourseUnit() {
  const unit = state.data.course.units.find((item) => item.id === state.course.unitId);
  if (!unit) {
    state.course.unitId = "";
    return renderCourse();
  }
  const guideModule = state.data.guide.modules.find((module) => module.id === unit.guide_module);
  const topics = unit.section_ids.map(getSectionById).filter(Boolean);
  const progress = getUnitProgress(unit.id);
  const next = state.data.course.units.find((item) => item.order === unit.order + 1);
  return `
    <section class="panel course-detail">
      <div class="split-head">
        <div>
          <p class="eyebrow">Unit ${unit.order} of ${state.data.course.units.length}</p>
          <h1>${escapeHtml(unit.title)}</h1>
          <p class="muted">${escapeHtml(unit.description)}</p>
          <p><strong>Time spent:</strong> ${formatDuration(currentElapsedSeconds(unit.id))} | <strong>Target:</strong> about ${unit.estimated_minutes}m</p>
        </div>
        <button class="btn ghost" type="button" data-action="back-course">Back to course</button>
      </div>
      <section class="guide-block">
        <h2>Study tasks</h2>
        <ul>${unit.study_tasks.map((task) => `<li>${escapeHtml(task)}</li>`).join("")}</ul>
      </section>
      ${guideModule ? `
        <section class="guide-block">
          <h2>Related guide module</h2>
          <p>${escapeHtml(guideModule.description)}</p>
          <button class="btn secondary" type="button" data-action="open-guide" data-module-id="${escapeHtml(guideModule.id)}">Open ${escapeHtml(guideModule.title)}</button>
        </section>
      ` : ""}
      <section class="guide-block">
        <h2>Official topic areas</h2>
        <div class="topic-grid">
          ${topics.map((topic) => `
            <button class="topic-chip" type="button" data-action="practice-section" data-section-id="${escapeHtml(topic.id)}">
              <strong>${escapeHtml(topic.number)}</strong>
              <span>${escapeHtml(topic.title)}</span>
            </button>
          `).join("")}
        </div>
      </section>
      <section class="guide-block">
        <h2>Source links</h2>
        <div class="resource-grid compact">
          ${unit.sources.map((source) => `
            <a class="resource-card" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">
              <strong>${escapeHtml(source.label)}</strong>
              <span>${escapeHtml(source.url.replace(/^https?:\/\//, ""))}</span>
            </a>
          `).join("")}
        </div>
      </section>
      <div class="actions">
        <button class="btn" type="button" data-action="practice-course-unit" data-unit-id="${escapeHtml(unit.id)}">Drill this unit</button>
        <button class="btn green" type="button" data-action="complete-course-unit" data-unit-id="${escapeHtml(unit.id)}">${progress.completedAt ? "Mark complete again" : "Mark complete"}</button>
        ${next ? `<button class="btn secondary" type="button" data-action="open-course-unit" data-unit-id="${escapeHtml(next.id)}">Next unit</button>` : ""}
      </div>
    </section>
  `;
}

function startCourseUnitPractice(unitId) {
  const unit = state.data.course.units.find((item) => item.id === unitId);
  if (!unit) return;
  settleCourseTime();
  const questions = unit.section_ids.flatMap((sectionId) => state.data.questionsBySection[sectionId] || []);
  startSession({
    title: `${unit.order}. ${unit.title}`,
    mode: "course",
    questions: shuffle(questions).slice(0, 30),
    instant: true,
  });
}

function renderResources() {
  return `
    ${hero("Study resources", "Official Government of Canada references plus the CLARES pages that were recommended for outside study.", "Resources")}
    <section class="resource-grid">
      ${state.data.course.resources.map((resource) => `
        <a class="resource-card" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener noreferrer">
          <span class="pill">${escapeHtml(resource.type)}</span>
          <h2>${escapeHtml(resource.title)}</h2>
          <p>${escapeHtml(resource.description)}</p>
          <small>${escapeHtml(resource.url.replace(/^https?:\/\//, ""))}</small>
        </a>
      `).join("")}
    </section>
  `;
}

function renderNextSteps() {
  const stats = getStats();
  const readiness = readinessScore();
  return `
    ${hero("Exam next steps", "Use this checklist when your mocks are stable and you are ready to move from study mode to booking the Basic exam.", "Next Steps")}
    <section class="grid four">
      ${statCard("Readiness", `${readiness}%`, readinessLabel(readiness))}
      ${statCard("Best mock", `${stats.bestMock}%`, officialExamStatus(stats.bestMock))}
      ${statCard("Course units", `${stats.courseDone}/${state.data.course.units.length}`, "Course path")}
      ${statCard("Weak topics", weakSections(100).filter(({ mastery }) => mastery.attempts && mastery.percent < 80).length, "Below 80%")}
    </section>
    <section class="grid two" style="margin-top: 16px;">
      ${state.data.course.next_steps.map((step, index) => `
        <article class="panel next-step-card">
          <span class="course-number">${index + 1}</span>
          <div>
            <h2>${escapeHtml(step.title)}</h2>
            <p class="muted">${escapeHtml(step.description)}</p>
            <div class="actions">
              ${step.action_type === "app"
                ? `<button class="btn" type="button" data-action="${escapeHtml(step.action_target)}">${escapeHtml(step.action)}</button>`
                : `<a class="btn secondary" href="${escapeHtml(step.action_target)}" target="_blank" rel="noopener noreferrer">${escapeHtml(step.action)}</a>`}
            </div>
          </div>
        </article>
      `).join("")}
    </section>
  `;
}

function renderGuide() {
  if (state.guide.moduleId) return renderGuideModule();
  return `
    ${hero("Comprehensive study guide", "Work through the eight RIC-3 Basic syllabus areas, then drill the exact official questions for each topic.", "Study Guide")}
    <section class="grid two">
      ${state.data.guide.modules.map((module) => {
        const complete = state.progress.guideCompletions[module.id];
        const major = getMajorById(module.major_id);
        const mastery = majorMastery(module.major_id);
        return `
          <article class="module-card" style="--accent:${escapeHtml(major.color)}">
            <span class="pill">${escapeHtml(module.major_id)}</span>
            <h2>${escapeHtml(module.title)}</h2>
            <p class="muted">${escapeHtml(module.description)}</p>
            <p>${mastery.attempts ? `${mastery.percent}% practice accuracy` : "No practice attempts yet"}</p>
            ${complete ? `<p class="result-good"><strong>Completed</strong> ${new Date(complete.completedAt).toLocaleDateString()}</p>` : ""}
            <div class="actions">
              <button class="btn" type="button" data-action="open-guide" data-module-id="${escapeHtml(module.id)}">${complete ? "Review" : "Study"}</button>
              <button class="btn secondary" type="button" data-action="practice-major" data-major-id="${escapeHtml(module.major_id)}">Drill questions</button>
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

function renderGuideModule() {
  const module = state.data.guide.modules.find((item) => item.id === state.guide.moduleId);
  if (!module) {
    state.guide.moduleId = "";
    return renderGuide();
  }
  const major = getMajorById(module.major_id);
  const topics = state.data.sections.filter((section) => section.major_id === module.major_id);
  return `
    <section class="panel guide-detail">
      <div class="split-head">
        <div>
          <p class="eyebrow">${escapeHtml(module.major_id)} | ${escapeHtml(major.title)}</p>
          <h1>${escapeHtml(module.title)}</h1>
          <p class="muted">${escapeHtml(module.description)}</p>
        </div>
        <button class="btn ghost" type="button" data-action="back-guide">Back</button>
      </div>
      ${module.sections.map(renderGuideSection).join("")}
      <section class="guide-topics">
        <h2>RIC-3 topic areas covered</h2>
        <div class="topic-grid">
          ${topics.map((topic) => `
            <button class="topic-chip" type="button" data-action="practice-section" data-section-id="${escapeHtml(topic.id)}">
              <strong>${escapeHtml(topic.number)}</strong>
              <span>${escapeHtml(topic.title)}</span>
            </button>
          `).join("")}
        </div>
      </section>
      <div class="actions">
        <button class="btn green" type="button" data-action="complete-guide" data-module-id="${escapeHtml(module.id)}">Mark module complete</button>
        <button class="btn secondary" type="button" data-action="practice-major" data-major-id="${escapeHtml(module.major_id)}">Drill this module</button>
      </div>
    </section>
  `;
}

function renderGuideSection(section) {
  if (section.type === "text") {
    return `<article class="guide-block"><h2>${escapeHtml(section.title)}</h2>${paragraphs(section.content)}</article>`;
  }
  if (section.type === "key_points") {
    return `<article class="guide-block"><h2>${escapeHtml(section.title)}</h2><ul>${section.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul></article>`;
  }
  if (section.type === "table") {
    return `<article class="guide-block"><h2>${escapeHtml(section.title)}</h2>${renderTable(section.columns, section.rows)}</article>`;
  }
  return "";
}

function paragraphs(content) {
  return String(content || "")
    .split(/\n{2,}/)
    .map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br>")}</p>`)
    .join("");
}

function makeQuestionInstance(question) {
  const order = shuffle(question.choices.map((_, index) => index));
  return {
    ...question,
    choices: order.map((index) => question.choices[index]),
    correct_index: order.indexOf(question.correct_index),
  };
}

function startSession({ title, mode, questions, instant = false }) {
  if (!questions.length) {
    alert("No questions are available for that selection.");
    return;
  }
  state.session = {
    id: `${mode}_${Date.now()}`,
    title,
    mode,
    instant,
    questions: shuffle(questions).map(makeQuestionInstance),
    userAnswers: {},
    recorded: [],
    flagged: [],
    currentIndex: 0,
    startTime: Date.now(),
  };
  state.reviewSession = null;
  setView("practice");
}

function startMockExam() {
  const questions = state.data.sections
    .map((section) => shuffle(state.data.questionsBySection[section.id] || [])[0])
    .filter(Boolean);
  startSession({
    title: "Official 100-question mock exam",
    mode: "mock",
    questions,
    instant: false,
  });
}

function adaptiveScore(question) {
  const stats = state.progress.questionStats[question.id];
  if (!stats?.attempts) return 10000;
  const accuracy = (stats.correct || 0) / stats.attempts;
  const wrongWeight = (stats.wrong || 0) * 300;
  const staleDays = stats.lastSeen ? (Date.now() - Date.parse(stats.lastSeen)) / 86400000 : 30;
  const bookmarkWeight = bookmarked(question.id) ? 450 : 0;
  return ((1 - accuracy) * 1000) + wrongWeight + Math.min(staleDays, 60) * 5 + bookmarkWeight;
}

function startAdaptiveStudy() {
  const questions = shuffle([...state.data.questions])
    .sort((a, b) => adaptiveScore(b) - adaptiveScore(a))
    .slice(0, 25);
  startSession({
    title: "Adaptive study",
    mode: "adaptive",
    questions,
    instant: true,
  });
}

function startMistakeDrill() {
  const questions = state.data.questions.filter((question) => {
    const stats = state.progress.questionStats[question.id];
    return stats && (stats.wrong || 0) > 0 && (stats.correct || 0) < (stats.attempts || 0);
  });
  startSession({
    title: "Missed-question drill",
    mode: "mistakes",
    questions: questions.slice(0, 50),
    instant: true,
  });
}

function startSectionPractice(sectionId) {
  const section = getSectionById(sectionId);
  const questions = state.data.questionsBySection[sectionId] || [];
  startSession({
    title: `${section.number} ${section.title}`,
    mode: "section",
    questions: questions.slice(0, 25),
    instant: true,
  });
}

function startMajorPractice(majorId) {
  const major = getMajorById(majorId);
  const questions = state.data.questions.filter((question) => question.major_id === majorId);
  startSession({
    title: `${major.short_title} drill`,
    mode: "major",
    questions: shuffle(questions).slice(0, 30),
    instant: true,
  });
}

function startCustomPractice() {
  const major = document.querySelector("[data-practice-major]")?.value || "all";
  const section = document.querySelector("[data-practice-section]")?.value || "all";
  const countValue = document.querySelector("[data-practice-count]")?.value || "25";
  const instant = document.querySelector("[data-practice-instant]")?.checked ?? true;
  let questions = [...state.data.questions];
  if (major !== "all") questions = questions.filter((question) => question.major_id === major);
  if (section !== "all") questions = questions.filter((question) => question.section_id === section);
  const count = countValue === "all" ? questions.length : Number(countValue);
  startSession({
    title: "Custom practice",
    mode: "custom",
    questions: shuffle(questions).slice(0, count),
    instant,
  });
}

function renderPractice() {
  if (state.session) return renderActiveSession();
  return `
    ${hero("Practice and mock exams", "Use the official question bank exactly, with detailed explanations after wrong answers.", "Practice")}
    <section class="grid three">
      <article class="action-card">
        <h2>Official mock exam</h2>
        <p class="muted">100 questions, one from each RIC-3 topic area. No instant feedback until review.</p>
        <button class="btn" type="button" data-action="start-mock">Start mock exam</button>
      </article>
      <article class="action-card">
        <h2>Adaptive study</h2>
        <p class="muted">Prioritizes weak topics, missed questions, stale questions and unseen questions.</p>
        <button class="btn secondary" type="button" data-action="start-adaptive">Start adaptive study</button>
      </article>
      <article class="action-card">
        <h2>Mistakes</h2>
        <p class="muted">Drill questions you previously missed until they stop being weak spots.</p>
        <button class="btn red" type="button" data-action="start-mistakes" ${mistakeCount() ? "" : "disabled"}>Drill ${mistakeCount()} mistakes</button>
      </article>
    </section>
    <section class="panel" style="margin-top: 16px;">
      <h2>Build custom practice</h2>
      <div class="form-grid">
        <label>
          <span>Major area</span>
          <select data-practice-major>
            <option value="all">All areas</option>
            ${state.data.majorTopics.map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.id)} ${escapeHtml(topic.short_title)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Topic area</span>
          <select data-practice-section>
            <option value="all">All topic areas</option>
            ${state.data.sections.map((section) => `<option value="${escapeHtml(section.id)}">${escapeHtml(section.number)} ${escapeHtml(section.title)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Question count</span>
          <select data-practice-count>
            <option value="10">10</option>
            <option value="25" selected>25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="all">All matching</option>
          </select>
        </label>
        <label class="check-row">
          <input type="checkbox" data-practice-instant checked>
          <span>Show explanations immediately</span>
        </label>
      </div>
      <div class="actions">
        <button class="btn green" type="button" data-action="start-custom">Start custom practice</button>
      </div>
    </section>
    ${state.reviewSession ? renderSessionReview(state.reviewSession) : ""}
  `;
}

function mistakeCount() {
  return state.data.questions.filter((question) => {
    const stats = state.progress.questionStats[question.id];
    return stats && (stats.wrong || 0) > 0 && (stats.correct || 0) < (stats.attempts || 0);
  }).length;
}

function renderActiveSession() {
  const session = state.session;
  const question = session.questions[session.currentIndex];
  const selected = session.userAnswers[question.id];
  const answered = selected !== undefined;
  const isCorrect = answered && selected === question.correct_index;
  const progressPercent = ((session.currentIndex + 1) / session.questions.length) * 100;
  return `
    <section class="session-shell">
      <div class="session-top">
        <div>
          <p class="eyebrow">${escapeHtml(session.mode === "mock" ? "Official mock exam" : "Practice")}</p>
          <h1>${escapeHtml(session.title)}</h1>
          <p class="muted">Question ${session.currentIndex + 1} of ${session.questions.length}</p>
        </div>
        <div class="actions">
          <button class="btn ghost" type="button" data-action="exit-session">Exit</button>
          <button class="btn green" type="button" data-action="submit-session">Submit</button>
        </div>
      </div>
      <div class="progress-line"><span style="width:${progressPercent}%"></span></div>
      <article class="question-card">
        <div class="question-meta">
          <span class="topic-badge">${escapeHtml(question.section_number)} ${escapeHtml(question.section_title)}</span>
          <button class="bookmark ${bookmarked(question.id) ? "active" : ""}" type="button" data-action="toggle-bookmark" data-question-id="${escapeHtml(question.id)}">${bookmarked(question.id) ? "Bookmarked" : "Bookmark"}</button>
        </div>
        <h2>${escapeHtml(question.question)}</h2>
        <div class="choice-list">
          ${question.choices.map((choice, index) => `
            <button
              class="choice-card ${choiceClass(question, selected, index, session.instant)}"
              type="button"
              data-action="answer-session"
              data-choice="${index}"
              ${answered && session.instant ? "disabled" : ""}
            >
              <strong>${String.fromCharCode(65 + index)}.</strong>
              <span>${escapeHtml(choice)}</span>
            </button>
          `).join("")}
        </div>
        ${session.instant && answered ? `
          <div class="${isCorrect ? "feedback good" : "feedback bad"}">
            <strong>${isCorrect ? "Correct" : "Incorrect"}</strong>
            ${renderExplanation(question, selected)}
          </div>
        ` : ""}
      </article>
      <div class="question-nav">
        <button class="btn secondary" type="button" data-action="prev-question" ${session.currentIndex === 0 ? "disabled" : ""}>Previous</button>
        <div class="dot-grid">
          ${session.questions.map((item, index) => `
            <button
              class="q-dot ${index === session.currentIndex ? "current" : ""} ${session.userAnswers[item.id] !== undefined ? "answered" : ""}"
              type="button"
              data-action="go-question"
              data-index="${index}"
              aria-label="Go to question ${index + 1}"
            >${index + 1}</button>
          `).join("")}
        </div>
        <button class="btn secondary" type="button" data-action="next-question" ${session.currentIndex === session.questions.length - 1 ? "disabled" : ""}>Next</button>
      </div>
    </section>
  `;
}

function choiceClass(question, selected, index, instant) {
  const classes = [];
  if (selected === index) classes.push("selected");
  if (instant && selected !== undefined) {
    if (index === question.correct_index) classes.push("correct");
    if (selected === index && index !== question.correct_index) classes.push("wrong");
  }
  return classes.join(" ");
}

function answerSession(choice) {
  const session = state.session;
  if (!session) return;
  const question = session.questions[session.currentIndex];
  const index = Number(choice);
  if (session.instant && session.userAnswers[question.id] !== undefined) return;
  session.userAnswers[question.id] = index;
  if (session.instant && !session.recorded.includes(question.id)) {
    recordQuestionAttempt(question, index === question.correct_index, question.choices[index]);
    session.recorded.push(question.id);
    saveProgress();
  }
  render();
}

function recordQuestionAttempt(question, isCorrect, selectedAnswer) {
  const stats = state.progress.questionStats[question.id] || {
    attempts: 0,
    correct: 0,
    wrong: 0,
    lastSeen: "",
    lastWrongAt: "",
    lastSelectedAnswer: "",
  };
  stats.attempts += 1;
  if (isCorrect) {
    stats.correct += 1;
  } else {
    stats.wrong += 1;
    stats.lastWrongAt = new Date().toISOString();
    stats.lastSelectedAnswer = selectedAnswer || "";
  }
  stats.lastSeen = new Date().toISOString();
  state.progress.questionStats[question.id] = stats;
}

function submitSession() {
  const session = state.session;
  if (!session) return;
  const unanswered = session.questions.length - Object.keys(session.userAnswers).length;
  if (unanswered && !confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;
  const record = recordSession(session);
  state.reviewSession = { ...session, record };
  state.session = null;
  saveProgress();
  setView("practice");
}

function recordSession(session) {
  let correct = 0;
  const topicBreakdown = {};
  session.questions.forEach((question) => {
    if (!topicBreakdown[question.major_id]) topicBreakdown[question.major_id] = { correct: 0, total: 0 };
    topicBreakdown[question.major_id].total += 1;
    const selected = session.userAnswers[question.id];
    const isCorrect = selected !== undefined && selected === question.correct_index;
    if (isCorrect) {
      correct += 1;
      topicBreakdown[question.major_id].correct += 1;
    }
    if (!session.recorded.includes(question.id)) {
      recordQuestionAttempt(question, isCorrect, selected === undefined ? "" : question.choices[selected]);
    }
  });
  const total = session.questions.length;
  const scorePercent = total ? round1((correct / total) * 100) : 0;
  const record = {
    id: session.id,
    title: session.title,
    mode: session.mode,
    timestamp: new Date().toISOString(),
    totalQuestions: total,
    correct,
    scorePercent,
    status: session.mode === "mock" ? officialExamStatus(scorePercent) : "Practice complete",
    timeTakenSeconds: Math.floor((Date.now() - session.startTime) / 1000),
    topicBreakdown,
    incorrectQuestionIds: session.questions
      .filter((question) => session.userAnswers[question.id] !== question.correct_index)
      .map((question) => question.id),
  };
  state.progress.examHistory.push(record);
  return record;
}

function renderSessionReview(session) {
  const record = session.record;
  const resultClass = record.scorePercent >= 80 ? "result-good" : record.scorePercent >= 70 ? "result-mid" : "result-bad";
  return `
    <section class="panel review-panel" style="margin-top: 16px;">
      <p class="eyebrow">Review</p>
      <h2 class="${resultClass}">${record.correct}/${record.totalQuestions} (${record.scorePercent}%)</h2>
      <p class="muted">${escapeHtml(record.status)} | Completed in ${formatDuration(record.timeTakenSeconds)}.</p>
      <div class="actions">
        <button class="btn secondary" type="button" data-action="review-all">Show all</button>
        <button class="btn red" type="button" data-action="review-wrong">Incorrect only</button>
        <button class="btn" type="button" data-action="start-adaptive">Study weak areas</button>
      </div>
      <div data-review-list>${renderReviewQuestions(session, "all")}</div>
    </section>
  `;
}

function renderReviewQuestions(session, mode) {
  return session.questions.map((question, index) => {
    const selected = session.userAnswers[question.id];
    const isCorrect = selected !== undefined && selected === question.correct_index;
    if (mode === "wrong" && isCorrect) return "";
    return `
      <article class="review-card">
        <div class="question-meta">
          <span class="topic-badge">${escapeHtml(question.id)} | ${escapeHtml(question.section_number)} ${escapeHtml(question.section_title)}</span>
          <button class="bookmark ${bookmarked(question.id) ? "active" : ""}" type="button" data-action="toggle-bookmark" data-question-id="${escapeHtml(question.id)}">${bookmarked(question.id) ? "Bookmarked" : "Bookmark"}</button>
        </div>
        <h3>Q${index + 1}. ${escapeHtml(question.question)}</h3>
        <div class="choice-list compact">
          ${question.choices.map((choice, choiceIndex) => {
            const classes = [
              choiceIndex === question.correct_index ? "correct" : "",
              selected === choiceIndex && choiceIndex !== question.correct_index ? "wrong" : "",
            ].join(" ");
            const suffix = choiceIndex === question.correct_index
              ? "Correct answer"
              : selected === choiceIndex
                ? "Your answer"
                : "";
            return `<div class="choice-card ${classes}"><strong>${String.fromCharCode(65 + choiceIndex)}.</strong><span>${escapeHtml(choice)}${suffix ? ` (${suffix})` : ""}</span></div>`;
          }).join("")}
        </div>
        ${renderExplanation(question, selected)}
      </article>
    `;
  }).join("");
}

function renderExplanation(question, selectedIndex = null) {
  const explanation = explanationFor(question);
  const correctAnswer = question.choices[question.correct_index] || question.correct_answer;
  const selectedAnswer = selectedIndex === null || selectedIndex === undefined ? "" : question.choices[selectedIndex];
  const selectedWrong = selectedAnswer && selectedIndex !== question.correct_index;
  return `
    <div class="explanation">
      <p><strong>${escapeHtml(explanation.summary || `The official answer is "${correctAnswer}".`)}</strong></p>
      ${selectedWrong ? `<p>Your answer, <strong>${escapeHtml(selectedAnswer)}</strong>, is not the official answer for this item. The correct answer is <strong>${escapeHtml(correctAnswer)}</strong>.</p>` : ""}
      <p>${escapeHtml(explanation.detail)}</p>
      ${selectedWrong ? `<p>${escapeHtml(explanation.wrong_answer_guidance)}</p>` : ""}
      <button class="link-button" type="button" data-action="open-guide" data-module-id="${escapeHtml(explanation.guide_module || question.major_slug)}">Review related guide module</button>
    </div>
  `;
}

function renderFormulas() {
  const drills = state.data.formulas.drills;
  const drill = drills[state.formula.index] || drills[0];
  const selected = state.formula.selected;
  const answered = selected !== null;
  const stats = state.progress.formulaStats[drill.id] || {};
  return `
    ${hero("Formula drills", "Practice the calculation and concept questions that tend to cost easy marks.", "Formula Practice")}
    <section class="formula-layout">
      <aside class="panel">
        <h2>Drill list</h2>
        <div class="stack">
          ${drills.map((item, index) => `
            <button class="deck-card ${index === state.formula.index ? "active" : ""}" type="button" data-action="select-formula" data-index="${index}">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${state.progress.formulaStats[item.id]?.attempts ? `${state.progress.formulaStats[item.id].correct}/${state.progress.formulaStats[item.id].attempts}` : "Not tried"}</small>
            </button>
          `).join("")}
        </div>
      </aside>
      <section class="question-card">
        <p class="eyebrow">${escapeHtml(drill.topic)}</p>
        <h2>${escapeHtml(drill.question)}</h2>
        <div class="choice-list">
          ${drill.choices.map((choice, index) => `
            <button class="choice-card ${formulaChoiceClass(drill, selected, index)}" type="button" data-action="answer-formula" data-choice="${index}" ${answered ? "disabled" : ""}>
              <strong>${String.fromCharCode(65 + index)}.</strong>
              <span>${escapeHtml(choice)}</span>
            </button>
          `).join("")}
        </div>
        ${answered ? `
          <div class="${selected === drill.correct_index ? "feedback good" : "feedback bad"}">
            <strong>${selected === drill.correct_index ? "Correct" : "Incorrect"}</strong>
            <p>${escapeHtml(drill.explanation)}</p>
          </div>
        ` : ""}
        <div class="actions">
          <button class="btn secondary" type="button" data-action="prev-formula" ${state.formula.index === 0 ? "disabled" : ""}>Previous</button>
          <span class="pill">${state.formula.index + 1}/${drills.length}</span>
          <button class="btn secondary" type="button" data-action="next-formula">Next</button>
        </div>
        <p class="muted">Your attempts on this drill: ${stats.attempts || 0}</p>
      </section>
    </section>
  `;
}

function formulaChoiceClass(drill, selected, index) {
  const classes = [];
  if (selected === index) classes.push("selected");
  if (selected !== null) {
    if (index === drill.correct_index) classes.push("correct");
    if (selected === index && index !== drill.correct_index) classes.push("wrong");
  }
  return classes.join(" ");
}

function answerFormula(choice) {
  const drill = state.data.formulas.drills[state.formula.index];
  const selected = Number(choice);
  state.formula.selected = selected;
  const stats = state.progress.formulaStats[drill.id] || { attempts: 0, correct: 0, lastSeen: "" };
  stats.attempts += 1;
  if (selected === drill.correct_index) stats.correct += 1;
  stats.lastSeen = new Date().toISOString();
  state.progress.formulaStats[drill.id] = stats;
  saveProgress();
  render();
}

function renderQuestionBank() {
  const filtered = filteredQuestions();
  return `
    ${hero("Official question bank", "Search and review exact English questions from the Government of Canada Basic Qualification bank.", "Question Bank")}
    <section class="panel">
      <div class="form-grid bank-controls">
        <label>
          <span>Search</span>
          <input type="search" data-bank-query value="${escapeHtml(state.bank.query)}" placeholder="Search question, answer, topic...">
        </label>
        <label>
          <span>Major area</span>
          <select data-bank-major>
            <option value="all">All areas</option>
            ${state.data.majorTopics.map((topic) => `<option value="${escapeHtml(topic.id)}" ${state.bank.major === topic.id ? "selected" : ""}>${escapeHtml(topic.id)} ${escapeHtml(topic.short_title)}</option>`).join("")}
          </select>
        </label>
        <label>
          <span>Topic area</span>
          <select data-bank-section>
            <option value="all">All topic areas</option>
            ${state.data.sections
              .filter((section) => state.bank.major === "all" || section.major_id === state.bank.major)
              .map((section) => `<option value="${escapeHtml(section.id)}" ${state.bank.section === section.id ? "selected" : ""}>${escapeHtml(section.number)} ${escapeHtml(section.title)}</option>`).join("")}
          </select>
        </label>
        <label class="check-row">
          <input type="checkbox" data-bank-bookmarked ${state.bank.bookmarkedOnly ? "checked" : ""}>
          <span>Bookmarked only</span>
        </label>
      </div>
      <p class="muted">${filtered.length} matching question(s). Showing ${Math.min(filtered.length, state.bank.limit)}.</p>
    </section>
    <section class="question-results">
      ${filtered.slice(0, state.bank.limit).map(renderBankQuestion).join("")}
    </section>
    ${filtered.length > state.bank.limit ? `
      <div class="actions center">
        <button class="btn secondary" type="button" data-action="show-more-bank">Show more</button>
      </div>
    ` : ""}
  `;
}

function filteredQuestions() {
  const query = state.bank.query.trim().toLowerCase();
  return state.data.questions.filter((question) => {
    if (state.bank.major !== "all" && question.major_id !== state.bank.major) return false;
    if (state.bank.section !== "all" && question.section_id !== state.bank.section) return false;
    if (state.bank.bookmarkedOnly && !bookmarked(question.id)) return false;
    if (!query) return true;
    return [
      question.id,
      question.question,
      question.correct_answer,
      question.section_title,
      question.major_title,
      ...question.choices,
    ].join(" ").toLowerCase().includes(query);
  });
}

function renderBankQuestion(question) {
  const explanation = explanationFor(question);
  return `
    <article class="review-card">
      <div class="question-meta">
        <span class="topic-badge">${escapeHtml(question.id)} | ${escapeHtml(question.section_number)} ${escapeHtml(question.section_title)}</span>
        <button class="bookmark ${bookmarked(question.id) ? "active" : ""}" type="button" data-action="toggle-bookmark" data-question-id="${escapeHtml(question.id)}">${bookmarked(question.id) ? "Bookmarked" : "Bookmark"}</button>
      </div>
      <h3>${escapeHtml(question.question)}</h3>
      <p><strong>Official answer:</strong> ${escapeHtml(question.correct_answer)}</p>
      <details>
        <summary>Show explanation and distractors</summary>
        <div class="choice-list compact">
          ${question.choices.map((choice, index) => `<div class="choice-card ${index === question.correct_index ? "correct" : ""}"><strong>${String.fromCharCode(65 + index)}.</strong><span>${escapeHtml(choice)}</span></div>`).join("")}
        </div>
        <div class="explanation">
          <p>${escapeHtml(explanation.detail)}</p>
          <button class="link-button" type="button" data-action="practice-section" data-section-id="${escapeHtml(question.section_id)}">Drill this topic</button>
        </div>
      </details>
    </article>
  `;
}

function renderFlashcards() {
  if (!state.flashcards.deckId) {
    state.flashcards.deckId = state.data.flashcards.decks[0]?.deck_id || "";
    loadFlashcardDeck();
  }
  const deck = state.data.flashcards.decks.find((item) => item.deck_id === state.flashcards.deckId);
  const card = state.flashcards.cards[state.flashcards.index];
  return `
    ${hero("Flashcards", "Use smart review to bring difficult cards back to the top.", "Flashcards")}
    <section class="flash-layout">
      <aside class="panel">
        <h2>Decks</h2>
        <div class="stack">
          ${state.data.flashcards.decks.map((item) => `
            <button class="deck-card ${item.deck_id === state.flashcards.deckId ? "active" : ""}" type="button" data-action="select-deck" data-deck-id="${escapeHtml(item.deck_id)}">
              <strong>${escapeHtml(item.title)}</strong>
              <small>${item.cards.length} cards</small>
            </button>
          `).join("")}
        </div>
      </aside>
      <section>
        <div class="panel">
          <h2>${escapeHtml(deck?.title || "Flashcards")}</h2>
          <div class="segmented">
            ${["smart", "shuffle", "ordered"].map((mode) => `<button class="${state.flashcards.mode === mode ? "active" : ""}" type="button" data-action="set-card-mode" data-card-mode="${mode}">${mode}</button>`).join("")}
          </div>
        </div>
        <button class="flashcard" type="button" data-action="flip-card">
          <span>${state.flashcards.flipped ? "Answer" : "Question"}</span>
          <strong>${escapeHtml(card ? (state.flashcards.flipped ? card.back : card.front) : "No card selected")}</strong>
        </button>
        <div class="actions center">
          <button class="btn secondary" type="button" data-action="prev-card" ${state.flashcards.index === 0 ? "disabled" : ""}>Previous</button>
          <span class="pill">${state.flashcards.index + 1}/${state.flashcards.cards.length}</span>
          <button class="btn secondary" type="button" data-action="next-card" ${state.flashcards.index >= state.flashcards.cards.length - 1 ? "disabled" : ""}>Next</button>
        </div>
        ${state.flashcards.flipped && card ? `
          <div class="actions center">
            <button class="btn red" type="button" data-action="rate-card" data-rating="again">Again</button>
            <button class="btn amber" type="button" data-action="rate-card" data-rating="hard">Hard</button>
            <button class="btn green" type="button" data-action="rate-card" data-rating="good">Good</button>
            <button class="btn" type="button" data-action="rate-card" data-rating="easy">Easy</button>
          </div>
        ` : ""}
      </section>
    </section>
  `;
}

function loadFlashcardDeck() {
  const deck = state.data.flashcards.decks.find((item) => item.deck_id === state.flashcards.deckId);
  const cards = deck ? deck.cards : [];
  if (state.flashcards.mode === "shuffle") {
    state.flashcards.cards = shuffle(cards);
  } else if (state.flashcards.mode === "smart") {
    state.flashcards.cards = [...cards].sort((a, b) => cardPriority(b) - cardPriority(a));
  } else {
    state.flashcards.cards = [...cards];
  }
  state.flashcards.index = 0;
  state.flashcards.flipped = false;
}

function cardPriority(card) {
  const stats = state.progress.flashcardStats[card.id] || {};
  const ratingWeight = { again: 5, hard: 4, good: 2, easy: 0 };
  return (ratingWeight[stats.rating] ?? 3) * 100 - (stats.views || 0);
}

function flipCard() {
  const card = state.flashcards.cards[state.flashcards.index];
  if (!card) return;
  state.flashcards.flipped = !state.flashcards.flipped;
  if (state.flashcards.flipped) {
    const stats = state.progress.flashcardStats[card.id] || { views: 0, rating: "", lastSeen: "" };
    stats.views += 1;
    stats.lastSeen = new Date().toISOString();
    state.progress.flashcardStats[card.id] = stats;
    saveProgress();
  }
  render();
}

function rateCard(rating) {
  const card = state.flashcards.cards[state.flashcards.index];
  if (!card) return;
  const stats = state.progress.flashcardStats[card.id] || { views: 0, rating: "", lastSeen: "" };
  stats.rating = rating;
  stats.lastSeen = new Date().toISOString();
  state.progress.flashcardStats[card.id] = stats;
  saveProgress();
  if (state.flashcards.index < state.flashcards.cards.length - 1) state.flashcards.index += 1;
  state.flashcards.flipped = false;
  render();
}

function renderCramSheets() {
  const sections = state.data.reference.sections;
  return `
    ${hero("Printable cram sheets", "Compact sheets for exam rules, privileges, call signs, formulas, safety and interference.", "Cram Sheets")}
    <section class="panel no-print">
      <div class="actions">
        <button class="btn" type="button" data-action="print-sheets">Print / save PDF</button>
        <button class="btn secondary" type="button" data-view="bank">Open question bank</button>
      </div>
    </section>
    <section class="print-sheet">
      <div class="print-title">
        <h1>Canadian Amateur Radio Basic Cram Sheets</h1>
        <p>Independent study aid based on RIC-3, RBR-4, RIC-9 and the official Basic question bank.</p>
      </div>
      ${sections.map(renderReferenceSection).join("")}
    </section>
  `;
}

function renderReferenceSection(section) {
  let body = "";
  if (section.type === "table") body = renderTable(section.columns, section.rows);
  if (section.type === "ordered_list") body = `<ol>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`;
  return `
    <article class="reference-card">
      <h2>${escapeHtml(section.title)}</h2>
      ${body}
    </article>
  `;
}

function renderTable(columns, rows) {
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table>
    </div>
  `;
}

function renderProgress() {
  const stats = getStats();
  const readiness = readinessScore();
  return `
    ${hero("Progress saved on this device", "Your attempts, weak topics, bookmarks, guide progress and flashcard ratings stay local unless you export them.", "Progress")}
    <section class="grid four">
      ${statCard("Readiness", `${readiness}%`, readinessLabel(readiness))}
      ${statCard("Attempts", stats.attempts, `${stats.accuracy}% correct`)}
      ${statCard("Topics touched", `${stats.sectionsTouched}/100`, "RIC-3 areas")}
      ${statCard("Bookmarks", state.progress.bookmarks.length, "Saved questions")}
    </section>
    <section class="panel" style="margin-top: 16px;">
      <h2>Major area mastery</h2>
      ${state.data.majorTopics.map((major) => {
        const mastery = majorMastery(major.id);
        return `
          <div class="mastery-row">
            <div>
              <strong>${escapeHtml(major.id)} ${escapeHtml(major.short_title)}</strong>
              <small>${mastery.attempts ? `${mastery.correct}/${mastery.attempts} correct` : "No attempts"}</small>
            </div>
            <div class="bar"><span style="width:${clamp(mastery.percent, 0, 100)}%; background:${escapeHtml(major.color)}"></span></div>
            <span>${mastery.percent}%</span>
          </div>
        `;
      }).join("")}
    </section>
    <section class="grid two" style="margin-top: 16px;">
      <article class="panel">
        <h2>Backup</h2>
        <p class="muted">Export progress for backup or import it on another device.</p>
        <div class="actions">
          <button class="btn" type="button" data-action="export-progress">Export</button>
          <label class="btn secondary" for="progress-import">Import</label>
          <input id="progress-import" type="file" accept="application/json,.json" data-progress-import hidden>
        </div>
      </article>
      <article class="panel">
        <h2>Reset</h2>
        <p class="muted">Clears only this app's local progress on this device.</p>
        <button class="btn red" type="button" data-action="reset-progress">Reset progress</button>
      </article>
    </section>
    <section class="panel" style="margin-top: 16px;">
      <h2>History</h2>
      ${renderHistory()}
    </section>
  `;
}

function renderHistory() {
  if (!state.progress.examHistory.length) return `<p class="muted">No completed sessions yet.</p>`;
  return [...state.progress.examHistory].reverse().slice(0, 20).map((record) => `
    <article class="mini-row history-row">
      <div>
        <strong>${escapeHtml(record.title)}</strong>
        <small>${new Date(record.timestamp).toLocaleString()} | ${formatDuration(record.timeTakenSeconds)}</small>
      </div>
      <span class="pill">${record.correct}/${record.totalQuestions} (${record.scorePercent}%)</span>
    </article>
  `).join("");
}

function renderAbout() {
  return `
    ${hero("About this study tool", "A static GitHub Pages app for studying the Canadian Amateur Radio Operator Certificate Basic Qualification.", "About")}
    <section class="grid two">
      <article class="panel">
        <h2>Official bank, independent explanations</h2>
        <p>The questions and official answers are parsed from the Government of Canada Basic Qualification question bank dated 26 August 2025. The explanations, guide text, flashcards, formula drills and cram sheets are independent study aids derived from the official documents.</p>
      </article>
      <article class="panel">
        <h2>Sources used</h2>
        <ul>
          <li>Basic Qualification Question Bank for Amateur Radio Operator Certificate Examinations.</li>
          <li>RIC-3, Information on the Amateur Radio Service, Issue 5, March 2022.</li>
          <li>RBR-4, Standards for the Operation of Radio Stations in the Amateur Radio Service, Issue 3, July 2022.</li>
          <li>RIC-9, Call Sign Policy and Special Event Prefixes.</li>
        </ul>
      </article>
      <article class="panel">
        <h2>Privacy</h2>
        <p>Progress is stored in your browser under <code>${PROGRESS_KEY}</code>. Nothing is uploaded by the app.</p>
      </article>
      <article class="panel">
        <h2>Version</h2>
        <p>App version ${APP_VERSION}. Static, no build step, deployable directly on GitHub Pages.</p>
      </article>
    </section>
  `;
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;

  if (action === "toggle-theme") toggleTheme();
  if (action === "start-mock") startMockExam();
  if (action === "start-adaptive") startAdaptiveStudy();
  if (action === "start-mistakes") startMistakeDrill();
  if (action === "start-custom") startCustomPractice();
  if (action === "practice-section") startSectionPractice(actionButton.dataset.sectionId);
  if (action === "practice-major") startMajorPractice(actionButton.dataset.majorId);
  if (action === "resume-course") {
    const unit = getCurrentCourseUnit();
    if (unit) openCourseUnit(unit.id);
  }
  if (action === "open-course-unit") openCourseUnit(actionButton.dataset.unitId);
  if (action === "back-course") {
    settleCourseTime();
    state.course.unitId = "";
    render();
  }
  if (action === "complete-course-unit") completeCourseUnit(actionButton.dataset.unitId);
  if (action === "practice-course-unit") startCourseUnitPractice(actionButton.dataset.unitId);
  if (action === "answer-session") answerSession(actionButton.dataset.choice);
  if (action === "submit-session") submitSession();
  if (action === "exit-session") {
    if (!state.session || confirm("Exit this session? Unsubmitted answers will be lost.")) {
      state.session = null;
      render();
    }
  }
  if (action === "prev-question" && state.session?.currentIndex > 0) {
    state.session.currentIndex -= 1;
    render();
  }
  if (action === "next-question" && state.session && state.session.currentIndex < state.session.questions.length - 1) {
    state.session.currentIndex += 1;
    render();
  }
  if (action === "go-question" && state.session) {
    state.session.currentIndex = Number(actionButton.dataset.index);
    render();
  }
  if (action === "review-all" && state.reviewSession) {
    document.querySelector("[data-review-list]").innerHTML = renderReviewQuestions(state.reviewSession, "all");
  }
  if (action === "review-wrong" && state.reviewSession) {
    document.querySelector("[data-review-list]").innerHTML = renderReviewQuestions(state.reviewSession, "wrong");
  }
  if (action === "open-guide") {
    state.guide.moduleId = actionButton.dataset.moduleId;
    setView("guide");
  }
  if (action === "back-guide") {
    state.guide.moduleId = "";
    render();
  }
  if (action === "complete-guide") {
    state.progress.guideCompletions[actionButton.dataset.moduleId] = { completedAt: new Date().toISOString() };
    saveProgress();
    render();
  }
  if (action === "toggle-bookmark") toggleBookmark(actionButton.dataset.questionId);
  if (action === "select-formula") {
    state.formula.index = Number(actionButton.dataset.index);
    state.formula.selected = null;
    render();
  }
  if (action === "answer-formula") answerFormula(actionButton.dataset.choice);
  if (action === "prev-formula" && state.formula.index > 0) {
    state.formula.index -= 1;
    state.formula.selected = null;
    render();
  }
  if (action === "next-formula") {
    state.formula.index = (state.formula.index + 1) % state.data.formulas.drills.length;
    state.formula.selected = null;
    render();
  }
  if (action === "select-deck") {
    state.flashcards.deckId = actionButton.dataset.deckId;
    loadFlashcardDeck();
    render();
  }
  if (action === "set-card-mode") {
    state.flashcards.mode = actionButton.dataset.cardMode;
    loadFlashcardDeck();
    render();
  }
  if (action === "flip-card") flipCard();
  if (action === "rate-card") rateCard(actionButton.dataset.rating);
  if (action === "prev-card" && state.flashcards.index > 0) {
    state.flashcards.index -= 1;
    state.flashcards.flipped = false;
    render();
  }
  if (action === "next-card" && state.flashcards.index < state.flashcards.cards.length - 1) {
    state.flashcards.index += 1;
    state.flashcards.flipped = false;
    render();
  }
  if (action === "show-more-bank") {
    state.bank.limit += 80;
    render();
  }
  if (action === "print-sheets") window.print();
  if (action === "export-progress") exportProgress();
  if (action === "reset-progress") resetProgress();
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-bank-query]")) {
    state.bank.query = event.target.value;
    state.bank.limit = 80;
    render();
    const input = document.querySelector("[data-bank-query]");
    if (input) {
      input.focus();
      input.setSelectionRange(state.bank.query.length, state.bank.query.length);
    }
  }
});

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-bank-major]")) {
    state.bank.major = event.target.value;
    state.bank.section = "all";
    state.bank.limit = 80;
    render();
  }
  if (event.target.matches("[data-bank-section]")) {
    state.bank.section = event.target.value;
    state.bank.limit = 80;
    render();
  }
  if (event.target.matches("[data-bank-bookmarked]")) {
    state.bank.bookmarkedOnly = event.target.checked;
    state.bank.limit = 80;
    render();
  }
  if (event.target.matches("[data-progress-import]")) {
    importProgress(event.target.files?.[0]);
    event.target.value = "";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, select, textarea")) return;
  if (state.session) {
    if (["1", "2", "3", "4"].includes(event.key)) {
      event.preventDefault();
      answerSession(Number(event.key) - 1);
    }
    if (event.key === "ArrowLeft" && state.session.currentIndex > 0) {
      event.preventDefault();
      state.session.currentIndex -= 1;
      render();
    }
    if (event.key === "ArrowRight" && state.session.currentIndex < state.session.questions.length - 1) {
      event.preventDefault();
      state.session.currentIndex += 1;
      render();
    }
  }
  if (state.view === "flashcards") {
    if (event.key === " ") {
      event.preventDefault();
      flipCard();
    }
  }
});

window.addEventListener("beforeunload", settleCourseTime);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    settleCourseTime();
    return;
  }
  resumeCourseTime();
});

async function init() {
  try {
    const [questions, topics, explanations, guide, course, reference, formulas, flashcards] = await Promise.all([
      fetch(DATA_PATHS.questions).then(loadJson),
      fetch(DATA_PATHS.topics).then(loadJson),
      fetch(DATA_PATHS.explanations).then(loadJson),
      fetch(DATA_PATHS.guide).then(loadJson),
      fetch(DATA_PATHS.course).then(loadJson),
      fetch(DATA_PATHS.reference).then(loadJson),
      fetch(DATA_PATHS.formulas).then(loadJson),
      fetch(DATA_PATHS.flashcards).then(loadJson),
    ]);
    const sectionsById = Object.fromEntries(topics.sections.map((section) => [section.id, section]));
    const majorById = Object.fromEntries(topics.major_topics.map((topic) => [topic.id, topic]));
    const questionsBySection = questions.questions.reduce((grouped, question) => {
      if (!grouped[question.section_id]) grouped[question.section_id] = [];
      grouped[question.section_id].push(question);
      return grouped;
    }, {});
    state.data = {
      questions: questions.questions,
      majorTopics: topics.major_topics,
      sections: topics.sections,
      sectionsById,
      majorById,
      questionsBySection,
      explanations: explanations.explanations,
      guide,
      course,
      reference,
      formulas,
      flashcards,
    };
    const initialView = window.location.hash.replace("#", "");
    if (initialView && document.querySelector(`[data-view="${CSS.escape(initialView)}"]`)) {
      state.view = initialView;
      navLinks.forEach((link) => link.classList.toggle("active", link.dataset.view === initialView));
    }
    render();
    registerServiceWorker();
  } catch (error) {
    app.innerHTML = `
      <section class="loading-card">
        <p class="eyebrow">Load error</p>
        <h1>Could not load the study data.</h1>
        <p class="muted">${escapeHtml(error.message)}</p>
      </section>
    `;
  }
}

async function loadJson(response) {
  if (!response.ok) throw new Error(`Failed to load ${response.url}`);
  return response.json();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {
    // Offline support is helpful but not required for basic use.
  });
}

init();
