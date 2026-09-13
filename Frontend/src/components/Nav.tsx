import React, { useState } from 'react';
import "../styles/nav.css";
import Link from './Link';
import { NavContext } from './nav-context';

export interface NavProps {
  currentPath?: string;
  locale?: string;
  isDomainScoped?: boolean;
}

export const Nav: React.FC<NavProps> = ({ currentPath, locale, isDomainScoped }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <NavContext.Provider value={{ currentPath, locale, isDomainScoped }}>
      <button
        type="button"
        className="nav-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          top: '1.5rem',
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
        <Link href="/#about" className="nav-link" onClick={() => setIsOpen(false)}>about</Link>
        <Link href="/comics" className="nav-link" onClick={() => setIsOpen(false)}>comics</Link>
        <Link href="/illustration" className="nav-link" onClick={() => setIsOpen(false)}>illustration</Link>
        <Link href="/process" className="nav-link" onClick={() => setIsOpen(false)}>process</Link>
        <Link href="/contact" className="nav-link" onClick={() => setIsOpen(false)}>contact</Link>
      </aside>
    </NavContext.Provider>
  );
};

export default Nav;
