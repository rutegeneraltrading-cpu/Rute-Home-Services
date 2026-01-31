'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Loading } from '@/components/common';

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = ({ children }: ProtectedLayoutProps) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen message="RUTE" />;
  }

  // Middleware will handle redirect, but show loading state while redirecting
  if (!isAuthenticated || !isAdmin) {
    return <Loading fullScreen message="RUTE" />;
  }

  return <>{children}</>;
};

export default ProtectedLayout;
