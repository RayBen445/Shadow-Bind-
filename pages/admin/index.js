/**
 * Admin Dashboard Page
 * Main entry point for administrative features
 */

import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import AdminDashboard from '../../components/admin/AdminDashboard';
import { withAdminAuth } from '../../lib/admin/middleware';

function AdminDashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner">⟳</div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-auth-required">
        <Head>
          <title>Admin Login Required - Shadow Bind</title>
        </Head>
        
        <main className="admin-login-page">
          <h1>Authentication Required</h1>
          <p>Please log in to access the administrative dashboard.</p>
          <Link href="/" className="btn btn-primary">Go to Login</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <Head>
        <title>Admin Dashboard - Shadow Bind</title>
        <meta name="description" content="Administrative dashboard for Shadow Bind messaging app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminDashboard user={user} />
    </div>
  );
}

// Apply admin authentication wrapper
export default withAdminAuth(AdminDashboardPage);