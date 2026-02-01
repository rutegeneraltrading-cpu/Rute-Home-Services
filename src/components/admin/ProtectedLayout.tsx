'use client';

import React from 'react';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  return <>{children}</>;
};

export default ProtectedLayout;
