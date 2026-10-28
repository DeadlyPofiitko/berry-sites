// src/components/ComicsList.tsx
import React, { useState, useMemo } from 'react';
import type { ComicsPageItem } from '../services/pages';
import './ComicsList.css';

export interface ComicsListProps {
  comics: ComicsPageItem[];
  locale?: string;
  isDomainScoped?: boolean;
}

export const ComicsList: React.FC<ComicsListProps> = ({
  comics = [],
  locale = 'en',
  isDomainScoped = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const isCs = locale.toLowerCase() === 'cs';

  // Filter comics by title (case-insensitive)
  const filteredComics = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return comics;

    return comics.filter((item) => {
      const title = (item.content?.title || '').toLowerCase();
      const urlSlug = (item.url || '').toLowerCase();
      return title.includes(query) || urlSlug.includes(query);
    });
  }, [comics, searchTerm]);

  return (
    <div className="comics-list-container">
      {/* Search Input */}
      <div className="comics-search-wrapper">
        <div className="comics-search-input-box">
          {/* <svg
            className="comics-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg> */}
          <input
            type="text"
            className="comics-search-input"
            placeholder="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={isCs ? 'Hledat komiksy' : 'Search comics'}
          />
          {searchTerm.trim().length > 0 && (
            <button
              type="button"
              className="comics-search-clear"
              onClick={() => setSearchTerm('')}
              title={isCs ? 'Vymazat hledání' : 'Clear search'}
              aria-label={isCs ? 'Vymazat hledání' : 'Clear search'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {searchTerm.trim().length > 0 && (
          <div className="comics-search-count">
            {isCs
              ? `Nalezeno ${filteredComics.length} z ${comics.length}`
              : `Found ${filteredComics.length} of ${comics.length}`}
          </div>
        )}
      </div>

      {/* Comics Titles List */}
      {filteredComics.length > 0 ? (
        <ul className="comics-list">
          {filteredComics.map((comic) => {
            const slug = comic.url.replace(/^\/+/, '').replace(/^comics\//, '');
            const targetHref =
              !isDomainScoped && locale && locale.toLowerCase() !== 'en'
                ? `/${locale}/comics/${slug}`
                : `/comics/${slug}`;
            const displayTitle = comic.content?.title?.trim() || slug;

            return (
              <li key={comic.url} className="comics-list__item">
                <a href={targetHref} className="comics-list__item-link">
                  {displayTitle}
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="comics-list-empty">
          <p>
            {isCs
              ? `Žádné komiksy neodpovídají "${searchTerm}"`
              : `No comics found matching "${searchTerm}"`}
          </p>
          <button
            type="button"
            className="comics-list-reset-btn"
            onClick={() => setSearchTerm('')}
          >
            {isCs ? 'Zobrazit všechny komiksy' : 'Show all comics'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ComicsList;
