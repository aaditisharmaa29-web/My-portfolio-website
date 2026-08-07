
(function () {
  const win = document.querySelector(".window--static");
  const dock = document.getElementById("dock");
  if (!win) return;

  const header = win.querySelector(".window-header");
  const minimiseBtn = win.querySelector(".window-minimise");
  const maximiseBtn = win.querySelector(".window-maximise");
  const titleEl = win.querySelector(".window-title");
  const title = titleEl ? titleEl.textContent.trim() : "Window";

  // ---- Drag ----
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener("mousedown", (event) => {
    if (event.target.closest("button, a")) return;
    if (win.classList.contains("maximised")) return;

    const rect = win.getBoundingClientRect();
    isDragging = true;
    win.classList.add("dragging");

    win.style.position = "fixed";
    win.style.margin = "0";
    win.style.width = rect.width + "px";
    win.style.left = rect.left + "px";
    win.style.top = rect.top + "px";

    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
  });

  document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    let x = event.clientX - offsetX;
    let y = event.clientY - offsetY;

    x = Math.max(0, Math.min(x, window.innerWidth - win.offsetWidth));
    y = Math.max(0, Math.min(y, window.innerHeight - win.offsetHeight));

    win.style.left = x + "px";
    win.style.top = y + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    win.classList.remove("dragging");
  });

  // ---- Maximise ----
  if (maximiseBtn) {
    maximiseBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      win.classList.toggle("maximised");
    });
  }

  // ---- Minimise (sends the window to the shared dock) ----
  if (minimiseBtn && dock) {
    minimiseBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      win.classList.add("hidden");

      if (dock.querySelector(`[data-dock-title="${title}"]`)) return;

      const item = document.createElement("button");
      item.className = "dock-item";
      item.dataset.dockTitle = title;
      item.innerHTML = `<span class="dock-item-dot"></span><span>${title}</span>`;

      item.addEventListener("click", () => {
        win.classList.remove("hidden");
        item.remove();
      });

      dock.appendChild(item);
    });
  }
})();