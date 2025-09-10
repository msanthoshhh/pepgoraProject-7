'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/hooks/useAuth';
import { logoutUser } from '@/lib/api'; 
import { getUserId, clearAuthData } from '@/lib/auth'; 
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiMenu } from 'react-icons/fi';

export default function Sidebar({ collapsed, setCollapsed }: { collapsed: boolean; setCollapsed: React.Dispatch<React.SetStateAction<boolean>> }) {
  const { userRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const userId = getUserId(); 
      await logoutUser(userId ?? '');
      clearAuthData(); 
      router.push('/login');
    } catch (error: any) {
      alert(error.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  // Expand sidebar when any icon is clicked in collapsed mode
  const handleExpandOnIconClick = (href: string) => {
    if (collapsed) {
      setCollapsed(false);
    } else {
      router.push(href);
    }
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M8 5a2 2 0 012-2h2a2 2 0 012 2v2H8V5z" />
    },
    { href: '/categories', label: 'Categories', icon: 
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
    },
    { href: '/subcategories', label: 'Subcategories', icon: 
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    },
    { href: '/products', label: 'Products', icon: 
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-10 flex flex-col bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Top: Logo & Toggle */}
      <div className={`flex items-center justify-between p-4 border-b border-gray-700 ${collapsed ? 'flex-col space-y-2' : ''}`}>
        <button
          className="focus:outline-none"
          onClick={() => router.push('/dashboard')}
        >
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center cursor-pointer">
            <img src="/pepagora_logo.jpeg" alt="Pepagora Logo" className="w-6 h-6 object-contain" />
          </div>
        </button>
        {!collapsed && (
          <div className="flex-1 ml-2">
            <span className="text-xl font-bold">Pepagora</span>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        )}
        <button
          className="ml-2 p-2 rounded-lg hover:bg-gray-700 focus:outline-none"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <FiChevronRight size={22} /> : <FiChevronLeft size={22} />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className={`flex-1 py-6 space-y-2 ${collapsed ? 'px-2' : 'px-4'}`}>
        {navItems.map(({ href, label, icon }) => (
          <button
            key={href}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-2 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group ${pathname === href ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
            onClick={() => collapsed ? setCollapsed(false) : router.push(href)}
            aria-label={label}
          >
            <svg className={`w-6 h-6 ${collapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {icon}
            </svg>
            {!collapsed && label}
          </button>
        ))}

        {/* Admin Only Section */}
        {userRole === 'admin' && (
          <div className={`pt-4 mt-4 border-t border-gray-700 ${collapsed ? 'px-2' : 'px-4'}`}>
            {!collapsed && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Admin Only
              </p>
            )}
            <button
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-2 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group ${pathname === '/AdminAccess' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              onClick={() => collapsed ? setCollapsed(false) : router.push('/AdminAccess')}
              aria-label="Add User"
            >
              <svg className={`w-6 h-6 ${collapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              {!collapsed && 'Add User'}
            </button>
            <button
              className={`w-full flex items-center ${collapsed ? 'justify-center' : ''} px-2 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group ${pathname === '/viewUser' ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-300'}`}
              onClick={() => collapsed ? setCollapsed(false) : router.push('/viewUser')}
              aria-label="View Users"
            >
              <svg className={`w-6 h-6 ${collapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {!collapsed && 'View Users'}
            </button>
          </div>
        )}
      </nav>

      {/* Logout Button */}
      <div className={`p-4 border-t border-gray-700 ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${collapsed ? 'max-w-[48px] px-0 py-2' : ''}`}
          disabled={loading}
          aria-label="Logout"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
          {!collapsed && !loading && <span className="ml-2">Logout</span>}
          {loading && !collapsed && <span className="ml-2">Logging out...</span>}
        </button>
      </div>
    </aside>
  );
}
