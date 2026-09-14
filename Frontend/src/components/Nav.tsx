import React, { useState } from 'react';
import "../styles/nav.css";
import Link from './Link';
import { NavContext } from './nav-context';

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
  const activeLinks = links && links.length > 0 ? links : defaultNavLinks;

  return (
    <NavContext.Provider value={{ currentPath, locale, isDomainScoped }}>
      <button
        type="button"
        className="nav-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          top: top || '1rem',
          left: '1rem',
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

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: '18rem',
          height: '50vh',
          background: '#fff',
          zIndex: 999,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
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
            onClick={() => setIsOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </aside>
    </NavContext.Provider>
  );
};

export default Nav;
