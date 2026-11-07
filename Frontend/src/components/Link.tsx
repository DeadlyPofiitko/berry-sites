import React from 'react';
import { getLocalizedPath, getClientLocaleInfo } from '../utils/i18n';
import { NavContext } from './nav-context';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  locale?: string;
  isDomainScoped?: boolean;
  smoothScroll?: boolean;
  active?: boolean;
  activeClassName?: string;
  currentPath?: string;
  children?: React.ReactNode;
}

// Global timestamp to suppress scroll-spy updates while programmatic smooth scrolling is in flight
let programmaticScrollUntil = 0;

function markProgrammaticScroll(durationMs: number = 1500) {
  programmaticScrollUntil = Math.max(programmaticScrollUntil, Date.now() + durationMs);
}

function getTargetElement(hash: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;

  const cleanHash = hash.replace(/^#/, '');
  if (!cleanHash) return null;

  // 1. Direct ID lookup
  let target: HTMLElement | null = document.getElementById(cleanHash);

  // 2. CSS escape query selector
  if (!target) {
    try {
      target = document.querySelector(`#${CSS.escape(cleanHash)}`);
    } catch {
      // ignore selector syntax errors
    }
  }

  // 3. Fallback: if targeting "about" and no #about exists, scroll to the h2 heading
  if (!target && cleanHash.toLowerCase() === 'about') {
    target = document.querySelector('h2');
  }

  return target;
}

function scrollToTarget(hash: string, smooth: boolean = true): boolean {
  const target = getTargetElement(hash);

  if (target) {
    if (smooth) {
      markProgrammaticScroll(1500);
    }
    target.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
      block: 'start',
    });
    return true;
  }

  return false;
}

export const Link: React.FC<LinkProps> = ({
  href,
  locale: propLocale,
  isDomainScoped: propIsDomainScoped,
  smoothScroll = true,
  active: propActive,
  activeClassName = 'active',
  currentPath: propCurrentPath,
  className,
  onClick,
  children,
  ...rest
}) => {
  const navCtx = React.useContext(NavContext);
  const effectiveLocale = propLocale ?? navCtx.locale;
  const effectiveDomainScoped = propIsDomainScoped ?? navCtx.isDomainScoped;
  const effectiveCurrentPath = propCurrentPath ?? navCtx.currentPath ?? '';

  const resolvedHref = React.useMemo(() => {
    if (effectiveLocale !== undefined) {
      return getLocalizedPath(href, effectiveLocale, effectiveDomainScoped ?? false);
    }
    const clientInfo = getClientLocaleInfo();
    return getLocalizedPath(href, clientInfo.locale, clientInfo.isDomainScoped);
  }, [href, effectiveLocale, effectiveDomainScoped]);

  // Use effectiveCurrentPath for initial render so SSR and client initial hydration match identically
  const [currentUrl, setCurrentUrl] = React.useState<{ pathname: string; hash: string }>(() => ({
    pathname: effectiveCurrentPath ? effectiveCurrentPath.replace(/\/$/, '') || '/' : '',
    hash: '',
  }));

  const [isMounted, setIsMounted] = React.useState(false);

  // Track browser location after mount
  React.useEffect(() => {
    setIsMounted(true);

    const updateLocation = () => {
      setCurrentUrl({
        pathname: window.location.pathname.replace(/\/$/, '') || '/',
        hash: window.location.hash || '',
      });
    };

    updateLocation();

    window.addEventListener('popstate', updateLocation);
    window.addEventListener('hashchange', updateLocation);
    window.addEventListener('locationchange', updateLocation);

    return () => {
      window.removeEventListener('popstate', updateLocation);
      window.removeEventListener('hashchange', updateLocation);
      window.removeEventListener('locationchange', updateLocation);
    };
  }, []);

  // Determine active status
  const [targetPathRaw, targetHashRaw] = resolvedHref.split('#');
  const targetPath = (targetPathRaw || '').replace(/\/$/, '') || '/';
  const targetHash = targetHashRaw ? `#${targetHashRaw}` : '';

  // Handle hash scrolling if user landed directly on a URL with a hash
  React.useEffect(() => {
    if (typeof window === 'undefined' || !targetHash) return;
    const currentPathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPathname !== targetPath || window.location.hash !== targetHash) return;

    markProgrammaticScroll(2000);
    const t1 = setTimeout(() => {
      scrollToTarget(targetHash, smoothScroll);
    }, 100);

    // Re-align after lazy images / layout shifts settle during initial cross-page scroll
    const t2 = setTimeout(() => {
      if (window.location.hash === targetHash) {
        const el = getTargetElement(targetHash);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (Math.abs(rect.top) > 120) {
            scrollToTarget(targetHash, smoothScroll);
          }
        }
      }
    }, 600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [targetHash, targetPath, smoothScroll]);

  const isAutoActive = React.useMemo(() => {
    const activePath = currentUrl.pathname;
    if (!activePath) return false;

    // Links with hash (e.g. /#about)
    if (targetHash) {
      return activePath === targetPath && currentUrl.hash === targetHash;
    }

    // Root page link (e.g. /)
    if (targetPath === '/' || targetPath === '/cs' || targetPath === '/en') {
      return activePath === targetPath && (!currentUrl.hash || !isMounted);
    }

    // Standard subpage link (e.g. /comics, /illustration, /process)
    return activePath === targetPath;
  }, [currentUrl, targetPath, targetHash, isMounted]);

  const isLinkActive = propActive !== undefined ? propActive : isAutoActive;

  // Scroll-spy observer for section anchors on the current page
  React.useEffect(() => {
    if (typeof window === 'undefined' || !targetHash) return;
    const currentPathname = window.location.pathname.replace(/\/$/, '') || '/';
    if (currentPathname !== targetPath) return;

    const cleanId = targetHash.replace(/^#/, '');
    const el =
      document.getElementById(cleanId) ||
      (cleanId.toLowerCase() === 'about' ? document.querySelector('h2') : null);
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < programmaticScrollUntil) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (window.location.hash !== targetHash) {
              window.history.replaceState(null, '', targetHash);
              window.dispatchEvent(new Event('locationchange'));
            }
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [targetHash, targetPath]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick(e);
    }

    if (e.defaultPrevented) return;

    if (resolvedHref.includes('#')) {
      const [pathPart, hashPart] = resolvedHref.split('#');

      if (typeof window !== 'undefined' && hashPart) {
        const currentPathname = window.location.pathname.replace(/\/$/, '') || '/';
        const targetPathname = (pathPart || '').replace(/\/$/, '') || '/';
        const isSamePage = targetPathname === currentPathname;

        if (isSamePage) {
          e.preventDefault();
          const scrolled = scrollToTarget(hashPart, smoothScroll);
          if (scrolled) {
            window.history.pushState(null, '', `#${hashPart}`);
            window.dispatchEvent(new Event('locationchange'));
          }
        }
      }
    }
  };

  const computedClassName = [
    className,
    isLinkActive ? activeClassName : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <a
      href={resolvedHref}
      onClick={handleClick}
      className={computedClassName}
      aria-current={isLinkActive ? 'page' : undefined}
      {...rest}
    >
      {children}
    </a>
  );
};

export default Link;
