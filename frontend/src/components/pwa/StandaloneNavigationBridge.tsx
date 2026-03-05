import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function isStandaloneDisplayMode() {
  const navigatorWithStandalone = navigator as NavigatorWithStandalone;
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

export default function StandaloneNavigationBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (!isStandaloneDisplayMode()) {
        return;
      }
      if (event.defaultPrevented) {
        return;
      }
      if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }
      if (anchor.target && anchor.target !== "_self") {
        return;
      }
      if (anchor.hasAttribute("download") || anchor.getAttribute("rel")?.includes("external")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      let destination: URL;
      try {
        destination = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (destination.origin !== window.location.origin) {
        return;
      }

      const nextPath = `${destination.pathname}${destination.search}${destination.hash}`;
      const currentPath = `${location.pathname}${location.search}${location.hash}`;
      if (nextPath === currentPath) {
        return;
      }

      event.preventDefault();
      navigate(nextPath);
    }

    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [location.hash, location.pathname, location.search, navigate]);

  return null;
}
