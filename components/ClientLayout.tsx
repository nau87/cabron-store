'use client';

import { ReactNode } from 'react';
import Header from './Header';

interface ClientLayoutProps {
  children: ReactNode;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export default function ClientLayout({ 
  children, 
  searchTerm = '', 
  onSearchChange,
  showSearch = false 
}: ClientLayoutProps) {
  return (
    <>
      <Header 
        searchTerm={showSearch ? searchTerm : undefined} 
        onSearchChange={showSearch ? onSearchChange : undefined} 
      />
      {children}
    </>
  );
}
