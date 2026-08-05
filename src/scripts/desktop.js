/* ===========================================================
   JAIPUR OS
   DESKTOP ENGINE
=========================================================== */

const desktop = document.getElementById("desktop");

const layer = document.getElementById("window-layer");

const navbarButtons = document.querySelectorAll("[data-app]");

let highestZ = 1;

let openWindows = [];

/* ===========================================================
   WINDOW DATA
=========================================================== */

const APPS = {
  resume: {
    title: "Resume",
  },

  projects: {
    title: "Projects",
  },

  fun: {
    title: "Fun",
  },

  contact: {
    title: "Contact",
  },
};

/* ===========================================================
   INITIALISE
=========================================================== */

init();

function init() {
  navbarButtons.forEach((button) => {
    button.addEventListener(
      "click",

      () => {
        openWindow(button.dataset.app);
      },
    );
  });
}

/* ===========================================================
   OPEN WINDOW
=========================================================== */

function openWindow(app) {
  const template = document.getElementById("window-template");

  const clone = template.content.firstElementChild.cloneNode(true);

  clone.style.zIndex = ++highestZ;

  clone.style.left = 60 + openWindows.length * 20 + "px";

  clone.style.top = 40 + openWindows.length * 20 + "px";

  clone.querySelector(".window-title").textContent = APPS[app].title;

  addEvents(clone);

  layer.appendChild(clone);

  openWindows.push(clone);
}
/* ===========================================================
   FOCUS
=========================================================== */

function focusWindow(window) {
  window.style.zIndex = ++highestZ;
}
/* ===========================================================
   DRAGGING
=========================================================== */

let activeWindow = null;

let isDragging = false;

let offsetX = 0;

let offsetY = 0;

function addEvents(window) {
  window.addEventListener("mousedown", () => {
    focusWindow(window);
  });

  const header = window.querySelector(".window-header");

  header.addEventListener("mousedown", (event) => {
    startDragging(event, window);
  });

  const closeButton = window.querySelector(".window-close");

  closeButton.addEventListener("click", () => {
    closeWindow(window);
  });

  const minimiseButton = window.querySelector(".window-minimise");

  minimiseButton.addEventListener("click", () => {
    minimiseWindow(window);
  });

  const maximiseButton = window.querySelector(".window-maximise");

  maximiseButton.addEventListener("click", () => {
    maximiseWindow(window);
  });
}
/* ===========================================================
   START DRAG
=========================================================== */

function startDragging(event, window) {
  isDragging = true;

  activeWindow = window;

  const rect = window.getBoundingClientRect();

  offsetX = event.clientX - rect.left;

  offsetY = event.clientY - rect.top;
}

/* ===========================================================
   MOUSE MOVE
=========================================================== */

document.addEventListener("mousemove", (event) => {
  if (!isDragging) return;

  const desktopRect = desktop.getBoundingClientRect();

  const windowRect = activeWindow.getBoundingClientRect();

  let x = event.clientX - desktopRect.left - offsetX;

  let y = event.clientY - desktopRect.top - offsetY;

  x = Math.max(
    0,

    Math.min(
      x,

      desktopRect.width - windowRect.width,
    ),
  );

  y = Math.max(
    0,

    Math.min(
      y,

      desktopRect.height - windowRect.height,
    ),
  );

  activeWindow.style.left = x + "px";

  activeWindow.style.top = y + "px";
});

/* ===========================================================
   STOP DRAG
=========================================================== */

document.addEventListener("mouseup", () => {
  isDragging = false;

  activeWindow = null;
});

/* ===========================================================
   WINDOW CONTROLS
=========================================================== */

function closeWindow(window) {
  window.remove();
}

function minimiseWindow(window) {
  window.style.display = "none";
}

function maximiseWindow(window) {
  window.classList.toggle("maximised");
}

/* ===========================================================
   RESIZE
=========================================================== */

let isResizing = false;

let resizeWindow = null;

let startWidth = 0;

let startHeight = 0;

let startMouseX = 0;

let startMouseY = 0;

function addEvents(window) {
  window.addEventListener("mousedown", () => {
    focusWindow(window);
  });

  const header = window.querySelector(".window-header");

  header.addEventListener("mousedown", (event) => {
    startDragging(event, window);
  });

  const handle = window.querySelector(".resize-handle");

  handle.addEventListener("mousedown", (event) => {
    startResize(event, window);
  });

  const closeButton = window.querySelector(".window-close");

  closeButton.addEventListener("click", () => {
    closeWindow(window);
  });

  const minimiseButton = window.querySelector(".window-minimise");

  minimiseButton.addEventListener("click", () => {
    minimiseWindow(window);
  });

  const maximiseButton = window.querySelector(".window-maximise");

  maximiseButton.addEventListener("click", () => {
    maximiseWindow(window);
  });
}

/* ===========================================================
   START RESIZE
=========================================================== */

function startResize(event, window) {
  event.stopPropagation();

  isResizing = true;

  resizeWindow = window;

  startMouseX = event.clientX;

  startMouseY = event.clientY;

  startWidth = window.offsetWidth;

  startHeight = window.offsetHeight;
}

/* ===========================================================
   RESIZE MOVE
=========================================================== */

document.addEventListener("mousemove", (event) => {
  if (!isResizing) return;

  const desktopRect = desktop.getBoundingClientRect();

  const rect = resizeWindow.getBoundingClientRect();

  let width = startWidth + (event.clientX - startMouseX);

  let height = startHeight + (event.clientY - startMouseY);

  width = Math.max(
    320,

    Math.min(
      width,

      desktopRect.width - parseFloat(resizeWindow.style.left || 0),
    ),
  );

  height = Math.max(
    220,

    Math.min(
      height,

      desktopRect.height - parseFloat(resizeWindow.style.top || 0),
    ),
  );

  resizeWindow.style.width = width + "px";

  resizeWindow.style.height = height + "px";
});

/* ===========================================================
   STOP RESIZE
=========================================================== */

document.addEventListener("mouseup", () => {
  isResizing = false;

  resizeWindow = null;
});
