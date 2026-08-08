// Every folder on the desktop, in order.
export const APPS = [
  { app: "resume", url: "/resume", title: "Resume", folder: "folder-blue" },
  { app: "projects", url: "/projects", title: "Projects", folder: "folder-orange" },
  { app: "fun", url: "/fun", title: "Fun", folder: "folder-green" },
  { app: "contact", url: "/contact", title: "Contact", folder: "folder-white" },
];

// Which window does a URL belong to?
// "/resume" is the resume window, "/projects/ammu" is the projects window,
// and "/" is the empty desktop.
export function appByUrl(pathname) {
  if (pathname.startsWith("/projects")) return "projects";

  for (const item of APPS) {
    if (pathname === item.url || pathname === item.url + "/") {
      return item.app;
    }
  }

  return "";
}
