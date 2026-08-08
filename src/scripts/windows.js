// Keeps the open windows in sync with localStorage and the current URL.
// localStorage holds a list of open windows, ordered bottom to top,
// so the last entry in the list is the window in front.

import { navigate } from "astro:transitions/client";
import { APPS } from "../data/apps";

const KEY = "desktop:windows";

function getApp(id) {
  return APPS.find((item) => item.app === id);
}

function currentApp() {
  return document.body.dataset.currentApp;
}

function loadStack() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || [];
    // ignore anything that is not a real app
    return saved.filter((entry) => entry && getApp(entry.app));
  } catch {
    return [];
  }
}

function saveStack(stack) {
  localStorage.setItem(KEY, JSON.stringify(stack));
}

// Runs on every page load. Rebuilds the windows on screen from the
// saved stack, then puts the current page's window in front.
function showWindows() {
  const layer = document.getElementById("window-layer");
  const stack = loadStack();
  const current = currentApp();
  let opening = false;

  if (current) {
    const index = stack.findIndex((entry) => entry.app === current);
    if (index >= 0) {
      // already open, move it to the front
      const entry = stack.splice(index, 1)[0];
      entry.min = false;
      stack.push(entry);
    } else {
      // not open yet, add it on top
      stack.push({
        app: current,
        x: 40 + stack.length * 24,
        y: 30 + stack.length * 24,
        w: 520,
        h: 360,
        min: false,
      });
      opening = true;
    }
  }

  // remove windows that are no longer in the stack
  for (const win of layer.querySelectorAll(".window")) {
    if (!stack.find((entry) => entry.app === win.dataset.app)) {
      win.remove();
    }
  }

  stack.forEach((entry, index) => {
    let win = layer.querySelector(`.window[data-app="${entry.app}"]`);

    if (!win) {
      const template = document.querySelector(`template[data-app="${entry.app}"]`);
      win = template.content.firstElementChild.cloneNode(true);
      layer.append(win);

      // only a freshly opened window plays the opening animation
      if (opening && entry.app === current) {
        win.classList.add("window--opening");
        win.addEventListener("animationend", () => win.classList.remove("window--opening"), {
          once: true,
        });
      }
    }

    win.style.left = entry.x + "px";
    win.style.top = entry.y + "px";
    win.style.width = entry.w + "px";
    win.style.height = entry.h + "px";
    win.style.zIndex = index + 1;
    win.classList.toggle("hidden", entry.min);
  });

  updateDock(stack);
  saveStack(stack);
}

// The dock shows a button for every minimised window.
function updateDock(stack) {
  const dock = document.getElementById("dock");
  dock.innerHTML = "";

  for (const entry of stack) {
    if (!entry.min) continue;
    const item = document.createElement("button");
    item.className = "dock-item";
    item.dataset.app = entry.app;
    item.innerHTML = `<span class="dock-item-dot"></span><span>${getApp(entry.app).title}</span>`;
    dock.append(item);
  }
}

function closeWindow(app) {
  const stack = loadStack().filter((entry) => entry.app !== app);
  saveStack(stack);

  const win = document.querySelector(`.window[data-app="${app}"]`);
  if (win) win.remove();
  updateDock(stack);

  // closing the current page's window goes to the window below it,
  // or back to the desktop if it was the last one
  if (app === currentApp()) {
    const below = stack[stack.length - 1];
    navigate(below ? getApp(below.app).url : "/");
  }
}

function minimiseWindow(app) {
  const stack = loadStack();
  const entry = stack.find((e) => e.app === app);
  if (entry) entry.min = true;
  saveStack(stack);

  const win = document.querySelector(`.window[data-app="${app}"]`);
  if (win) win.classList.add("hidden");
  updateDock(stack);
}

function restoreWindow(app) {
  if (app === currentApp()) {
    const stack = loadStack();
    const entry = stack.find((e) => e.app === app);
    if (entry) entry.min = false;
    saveStack(stack);
    showWindows();
  } else {
    navigate(getApp(app).url);
  }
}

// Project folders inside the projects window swap content in place.
function openProject(win, id) {
  win.querySelector(".projects-grid").style.display = "none";
  win.querySelector(".projects-back-btn").style.display = "inline-flex";
  for (const view of win.querySelectorAll(".project-detail-view")) {
    view.classList.toggle("active", view.dataset.view === id);
  }
}

function closeProject(win) {
  win.querySelector(".projects-grid").style.display = "";
  win.querySelector(".projects-back-btn").style.display = "none";
  for (const view of win.querySelectorAll(".project-detail-view")) {
    view.classList.remove("active");
  }
}

document.addEventListener("click", (event) => {
  const icon = event.target.closest(".desktop-icon");
  if (icon) {
    navigate(icon.dataset.url);
    return;
  }

  const dockItem = event.target.closest(".dock-item");
  if (dockItem) {
    restoreWindow(dockItem.dataset.app);
    return;
  }

  const win = event.target.closest(".window");
  if (!win) return;
  const app = win.dataset.app;

  if (event.target.closest(".window-close")) {
    closeWindow(app);
    return;
  }
  if (event.target.closest(".window-minimise")) {
    minimiseWindow(app);
    return;
  }
  if (event.target.closest(".window-maximise")) {
    win.classList.toggle("maximised");
    return;
  }

  const folder = event.target.closest(".project-folder-item");
  if (folder) {
    event.preventDefault();
    openProject(win, folder.dataset.project);
    return;
  }
  if (event.target.closest(".projects-back-btn")) {
    event.preventDefault();
    closeProject(win);
    return;
  }

  // clicking a window that is not in front brings it forward
  if (app !== currentApp()) {
    navigate(getApp(app).url);
  }
});

// Dragging and resizing.
let dragging = null;
let resizing = null;

document.addEventListener("mousedown", (event) => {
  const handle = event.target.closest(".resize-handle");
  const header = event.target.closest(".window-header");

  if (handle) {
    const win = handle.closest(".window");
    resizing = {
      win,
      startW: win.offsetWidth,
      startH: win.offsetHeight,
      startX: event.clientX,
      startY: event.clientY,
    };
  } else if (header && !event.target.closest("button")) {
    const win = header.closest(".window");
    if (win.classList.contains("maximised")) return;
    const rect = win.getBoundingClientRect();
    dragging = {
      win,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
  }
});

document.addEventListener("mousemove", (event) => {
  const desktop = document.getElementById("desktop");
  if (!desktop) return;
  const bounds = desktop.getBoundingClientRect();

  if (dragging) {
    const win = dragging.win;
    let x = event.clientX - bounds.left - dragging.offsetX;
    let y = event.clientY - bounds.top - dragging.offsetY;
    x = Math.max(0, Math.min(x, bounds.width - win.offsetWidth));
    y = Math.max(0, Math.min(y, bounds.height - win.offsetHeight));
    win.style.left = x + "px";
    win.style.top = y + "px";
  }

  if (resizing) {
    const win = resizing.win;
    const w = resizing.startW + event.clientX - resizing.startX;
    const h = resizing.startH + event.clientY - resizing.startY;
    win.style.width = Math.max(320, w) + "px";
    win.style.height = Math.max(220, h) + "px";
  }
});

document.addEventListener("mouseup", () => {
  const moved = dragging ? dragging.win : resizing ? resizing.win : null;
  dragging = null;
  resizing = null;
  if (!moved) return;

  // save the new position and size
  const stack = loadStack();
  const entry = stack.find((e) => e.app === moved.dataset.app);
  if (entry) {
    entry.x = parseInt(moved.style.left);
    entry.y = parseInt(moved.style.top);
    entry.w = moved.offsetWidth;
    entry.h = moved.offsetHeight;
    saveStack(stack);
  }
});

// The clock in the menu bar.
function updateClock() {
  const clock = document.getElementById("menu-clock");
  if (!clock) return;

  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const period = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  clock.textContent = `${hours}:${minutes}:${seconds} ${period}`;
}

updateClock();
setInterval(updateClock, 1000);

// astro:page-load fires on the first load and after every navigation.
document.addEventListener("astro:page-load", showWindows);
