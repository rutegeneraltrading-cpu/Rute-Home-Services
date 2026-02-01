'use client';

import React from 'react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  // Middleware already handles auth check and role-based routing
  // No need to double-check here
  return <>{children}</>;
};

export default ProtectedLayout;
