import React from 'react';

export interface NavContextValue {
  currentPath?: string;
  locale?: string;
  isDomainScoped?: boolean;
}

export const NavContext = React.createContext<NavContextValue>({});
