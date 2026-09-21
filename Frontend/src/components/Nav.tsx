import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '@nanostores/react';
import "../styles/nav.css";
import Link from './Link';
import { NavContext } from './nav-context';
import { $isAuthenticated, fetchCurrentUser } from '../stores/auth';
import { SUPPORTED_LOCALES } from '../utils/i18n';

export interface NavItem {
  href: string;
  label: string;
}

export interface NavProps {
  currentPath?: string;
  locale?: string;
  isDomainScoped?: boolean;
  links?: NavItem[];
  top?: string;
}

const defaultNavLinks: NavItem[] = [
  { href: '/#about', label: 'about' },
  { href: '/comics', label: 'comics' },
  { href: '/illustration', label: 'illustration' },
  { href: '/process', label: 'process' },
  { href: '/contact', label: 'contact' },
];

export const Nav: React.FC<NavProps> = ({ currentPath, locale, isDomainScoped, links, top }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [lastClick, setLastClick] = useState(0);
  const isAuthenticated = useStore($isAuthenticated);

  const btnRef = useRef<HTMLButtonElement>(null);
  const asideRef = useRef<HTMLElement>(null);

  const isHomePath = (path?: string) => {
    const cleanPath = (path || '/').split('#')[0].split('?')[0].replace(/\/$/, '') || '/';
    return cleanPath === '/' || (SUPPORTED_LOCALES as readonly string[]).some((loc) => cleanPath === `/${loc}`);
  };

  const checkIsHomeTop = () => {
    const rawPath = typeof window !== 'undefined' ? window.location.pathname : currentPath;
    if (!isHomePath(rawPath)) return false;
    if (typeof window === 'undefined') return true;
    return window.scrollY <= 10;
  };

  // Initialize strictly based on currentPath so SSR and initial client hydration match identically
  const [showBtn, setShowBtn] = useState<boolean>(() => isHomePath(currentPath));

  useEffect(() => {
    fetchCurrentUser();
    const media = window.matchMedia("(min-width: 1200px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (checkIsHomeTop() && (Date.now() - lastClick > 500)) {
        setIsOpen(false);
      }
      setShowBtn(checkIsHomeTop());
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('popstate', handleScroll);
    window.addEventListener('hashchange', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handleScroll);
      window.removeEventListener('hashchange', handleScroll);
    };
  }, [currentPath, lastClick]);

  // Close nav on any click inside the website or escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;

      // If clicking the toggle button or its children, let the button's own onClick handle toggle
      if (btnRef.current && btnRef.current.contains(target)) {
        return;
      }

      // Any other click inside the website closes the nav
      setIsOpen(false);
      setLastClick(Date.now());
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Use capture phase so clicks on any element trigger closure,
    // with a tiny delay so the opening click does not immediately re-close it
    const timer = setTimeout(() => {
      window.addEventListener('click', handleDocumentClick, true);
    }, 0);

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleDocumentClick, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const baseLinks = links && links.length > 0 ? links : defaultNavLinks;

  const activeLinks = useMemo(() => {
    if (!isAuthenticated) {
      return baseLinks;
    }

    const hasAdminLink = baseLinks.some(
      (link) => link.href === '/dashboard/admin' || link.href.endsWith('/dashboard/admin')
    );

    if (!hasAdminLink) {
      return [...baseLinks, { href: '/dashboard/admin', label: 'admin' }];
    }

    return baseLinks;
  }, [baseLinks, isAuthenticated]);

  return (
    <NavContext.Provider value={{ currentPath, locale, isDomainScoped }}>
      <div style={{ 
          top: '0', 
          left: '0', 
          zIndex: 1000, 
          position: 'fixed', 
          backgroundColor: 'var(--white-color)', 
          width: '100vw' 
        }}>
        <button
          ref={btnRef}
          type="button"
          className={`nav-btn ${showBtn ? '' : 'hide-btn'}`.trim()}
          onClick={() => setIsOpen((prev) => !prev)}
          style={{
            // position: 'fixed',
            marginBlock: top || '1rem',
            marginInline: '1rem',
            zIndex: 1000,
            backgroundColor: 'var(--white-color)',
            border: 'none',
            display: 'flex',
            flexDirection: 'row',
            gap: '5px',
            padding: '10px',
            cursor: 'pointer',
          }}
        >
          <div className="box box-one"></div>
          <div className="box box-two"></div>
          <div className="box box-three"></div>
        </button>
      </div>

      <aside
        ref={asideRef}
        className={`${showBtn ? '' : 'hide-aside'} ${isOpen ? 'open-aside' : 'close-aside'}`.trim()}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '18rem',
          minHeight: '50vh',
          height: 'auto',
          maxHeight: '100vh',
          overflowY: 'auto',
          background: '#fff',
          zIndex: 999,
          transition: 'transform 0.3s ease, padding 0.1s ease',
          display: 'flex',
          flexDirection: 'column',
          padding: '4.5rem 1.5rem 1.5rem',
          boxSizing: 'border-box',
          gap: '1rem',
        }}
      >
        {activeLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link"
            onClick={() => {
              setIsOpen(false);
              setLastClick(Date.now());
            }}
          >
            {link.label}
          </Link>
        ))}
      </aside>
    </NavContext.Provider>
  );
};

export default Nav;

