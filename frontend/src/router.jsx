import { useCallback, useEffect, useSyncExternalStore } from "react";

/* Minimal history router.
   Two views only — the landing page and the analyzer — so a dependency
   isn't warranted. Vercel rewrites every route to index.html, so clean
   paths work in production. */

const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function normalize(path) {
  if (!path) return "/";
  const clean = path.replace(/\/+$/, "");
  if (clean === "/app" || clean === "/app/") return "/app";
  return "/";
}

export function navigate(to, { replace = false } = {}) {
  const next = normalize(to);
  if (next === normalize(window.location.pathname)) return;
  window.history[replace ? "replaceState" : "pushState"]({}, "", next);
  notify();
}

export function useRoute() {
  const path = useSyncExternalStore(
    subscribe,
    () => normalize(window.location.pathname),
    () => "/"
  );

  useEffect(() => {
    const onPop = () => notify();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return path;
}

export function Link({ to, onNavigate, children, ...rest }) {
  const handle = useCallback(
    (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      onNavigate?.();
      navigate(to);
    },
    [to, onNavigate]
  );

  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}

/** Scrolls to the top on every route change, or to a hash when present. */
export function useScrollTarget(hash, ready, route) {
  useEffect(() => {
    if (!ready) return;
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [hash, ready, route]);
}
