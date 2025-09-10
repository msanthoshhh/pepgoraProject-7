'use client';

import { useAuth } from '@/components/hooks/useAuth';
import SignupPage from '../signup/page';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import UserManagement from '@/components/UserManagement';

export default function AdminAccess() {
  const { userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userRole !== 'admin') {
      router.push('/unauthorized');
    }
  }, [userRole, loading, router]);

  if (loading) return <p className="text-center mt-10">Checking access...</p>;
  if (userRole !== 'admin') return null;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Sidebar />
      
      <SignupPage />

      {/* <UserManagement /> View, Update, Delete */}
    </div>
  );
}
