const macFrame = document.querySelector(".mac-frame");
const desktop = document.getElementById("desktop");
const layer = document.getElementById("window-layer");
const navbarButtons = document.querySelectorAll("[data-app]");
const backButton = document.getElementById("back-button");
const dock = document.getElementById("dock");

let highestZ = 1;
let openWindows = [];

const APPS = {
  resume: { title: "Resume" },
  projects: { title: "Projects" },
  fun: { title: "Fun" },
  contact: { title: "Contact" },
};

function init() {
  navbarButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openWindow(button.dataset.app);
    });

  }); 
  startMenuClock(); 
}

function startMenuClock() {
  const clockEl = document.getElementById("menu-clock");
  if (!clockEl) return;

  function tick() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    const period = hours >= 12 ? "pm" : "am";

    hours = hours % 12;
    if (hours === 0) hours = 12;

    clockEl.textContent = `${hours}:${minutes}:${seconds} ${period}`;
  }

  tick();
  setInterval(tick, 1000);
}

function openWindow(app) {
  // Trigger zoom animation & show back button
  macFrame.classList.add("zoomed");
  backButton.classList.add("visible");

 const existing = windowExists(app);
if (existing) {
  if (existing.classList.contains("hidden")) {
    restoreWindow(existing);
  } else {
    focusWindow(existing);
  }
  return;
}

  const template = document.getElementById("window-template");
  const win = template.content.firstElementChild.cloneNode(true);

  win.dataset.app = app;
  win.style.left = 40 + openWindows.length * 24 + "px";
  win.style.top = 30 + openWindows.length * 24 + "px";
  win.style.zIndex = ++highestZ;
  win.querySelector(".window-title").textContent = APPS[app].title;

  const source = document.getElementById(`${app}-template`);
  const content = source.cloneNode(true);
  content.removeAttribute("id");
  win.querySelector(".window-content").appendChild(content);

  addEvents(win);
  layer.appendChild(win);
  openWindows.push(win);
}

function zoomOut() {
  macFrame.classList.remove("zoomed");
  backButton.classList.remove("visible");

  openWindows.forEach((win) => win.remove());
  openWindows = [];
}

backButton.addEventListener("click", zoomOut);

function focusWindow(win) {
  win.style.zIndex = ++highestZ;
}

function windowExists(app) {
  return openWindows.find((win) => win.dataset.app === app);
}

let activeWindow = null;
let isDragging = false;
let offsetX = 0;
let offsetY = 0;

function startDragging(event, win) {
  isDragging = true;
  activeWindow = win;
  const rect = win.getBoundingClientRect();
  offsetX = event.clientX - rect.left;
  offsetY = event.clientY - rect.top;
}

document.addEventListener("mousemove", (event) => {
  if (!isDragging) return;
  const desktopRect = desktop.getBoundingClientRect();
  const winRect = activeWindow.getBoundingClientRect();

  let x = event.clientX - desktopRect.left - offsetX;
  let y = event.clientY - desktopRect.top - offsetY;

  x = Math.max(0, Math.min(x, desktopRect.width - winRect.width));
  y = Math.max(0, Math.min(y, desktopRect.height - winRect.height));

  activeWindow.style.left = x + "px";
  activeWindow.style.top = y + "px";
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  activeWindow = null;
});

function closeWindow(win) {
  openWindows = openWindows.filter((w) => w !== win);
  removeDockItem(win);
  win.remove();
}

function minimiseWindow(win) {
  win.classList.add("hidden");
  addDockItem(win);
}

function restoreWindow(win) {
  win.classList.remove("hidden");
  removeDockItem(win);
  focusWindow(win);
}

function addDockItem(win) {
  const app = win.dataset.app;
  if (dock.querySelector(`[data-dock-app="${app}"]`)) return;

  const item = document.createElement("button");
  item.className = "dock-item";
  item.dataset.dockApp = app;
  item.innerHTML = `<span class="dock-item-dot"></span><span>${APPS[app].title}</span>`;

  item.addEventListener("click", () => restoreWindow(win));

  dock.appendChild(item);
}

function removeDockItem(win) {
  const item = dock.querySelector(`[data-dock-app="${win.dataset.app}"]`);
  if (item) item.remove();
}

function maximiseWindow(win) {
  win.classList.toggle("maximised");
}

let isResizing = false;
let resizeWindow = null;
let startWidth = 0;
let startHeight = 0;
let startMouseX = 0;
let startMouseY = 0;

function addEvents(win) {
  win.addEventListener("mousedown", () => focusWindow(win));

  win.querySelector(".window-header").addEventListener("mousedown", (event) => {
    startDragging(event, win);
  });

  win.querySelector(".resize-handle").addEventListener("mousedown", (event) => {
    startResize(event, win);
  });

  // Action Buttons
  win.querySelector(".window-close").addEventListener("click", (e) => {
    e.stopPropagation();
    closeWindow(win);
  });

  win.querySelector(".window-minimise").addEventListener("click", (e) => {
    e.stopPropagation();
    minimiseWindow(win);
  });

  win.querySelector(".window-maximise").addEventListener("click", (e) => {
    e.stopPropagation();
    maximiseWindow(win);
  });
}

function startResize(event, win) {
  event.stopPropagation();
  isResizing = true;
  resizeWindow = win;
  startMouseX = event.clientX;
  startMouseY = event.clientY;
  startWidth = win.offsetWidth;
  startHeight = win.offsetHeight;
}

document.addEventListener("mousemove", (event) => {
  if (!isResizing) return;
  const desktopRect = desktop.getBoundingClientRect();

  let width = startWidth + (event.clientX - startMouseX);
  let height = startHeight + (event.clientY - startMouseY);

  width = Math.max(320, Math.min(width, desktopRect.width - parseFloat(resizeWindow.style.left || 0)));
  height = Math.max(220, Math.min(height, desktopRect.height - parseFloat(resizeWindow.style.top || 0)));

  resizeWindow.style.width = width + "px";
  resizeWindow.style.height = height + "px";
});

document.addEventListener("mouseup", () => {
  isResizing = false;
  resizeWindow = null;
});

init();
