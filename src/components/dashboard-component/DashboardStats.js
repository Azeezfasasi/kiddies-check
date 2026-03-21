"use client"
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Client-only last updated time to prevent hydration mismatch
function LastUpdated({ timestamp }) {
  const [now, setNow] = useState('');
  
  useEffect(() => {
    // Update time on client side only
    const updateTime = () => setNow(new Date().toLocaleString());
    updateTime();
    
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return now ? <p className="text-sm text-gray-500 font-semibold">Last updated: <span className='font-normal'><time>{now}</time></span></p> : null;
}

function Icon({ name }) {
  switch (name) {
    case 'users':
      return (
        <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'leaders':
      return (
        <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    case 'specialists':
      return (
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m0 0h6M12 6H6M6 12h6m6 0h6" />
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
      )
    case 'teachers':
      return (
        <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      )
    case 'students':
      return (
        <svg className="w-6 h-6 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5m0 0v10c0 1.105 4.02 5 9 5s9-3.895 9-5v-10" />
        </svg>
      )
    case 'parents':
      return (
        <svg className="w-6 h-6 text-orange-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
        </svg>
      )
    case 'admin':
      return (
        <svg className="w-6 h-6 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="2.5" strokeWidth="2" />
        </svg>
      )
    case 'blogs':
      return (
        <svg className="w-6 h-6 text-cyan-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
        </svg>
      )
    case 'contacts':
      return (
        <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 8V7l-3 2-2-1-3 2V7L3 12v6a2 2 0 002 2h14a2 2 0 002-2v-8z" />
        </svg>
      )
    case 'requests':
      return (
        <svg className="w-6 h-6 text-pink-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
}

function Count({ value = 0, duration = 800 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let frame
    const start = performance.now()
    const from = display
    const to = Number(value) || 0

    function step(now) {
      const t = Math.min(1, (now - start) / duration)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t // easeInOutQuad-like
      const current = Math.round(from + (to - from) * eased)
      setDisplay(current)
      if (t < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <span className="text-2xl md:text-3xl font-bold text-gray-900">{display.toLocaleString()}</span>
}

export default function DashboardStats({ data = {} }) {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  // Fetch stats from backend
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get('/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success && response.data.stats) {
          setStats(response.data.stats);
          setLastUpdated(response.data.timestamp || new Date().toISOString());
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load statistics');

        // Fallback to provided data or defaults
        const defaults = {
          users: 0,
          blogs: 0,
          contacts: 0,
          quotes: 0,
          projects: 0,
          requests: 0,
        };
        setStats({ ...defaults, ...data });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStats();

      // Refresh stats every 5 minutes
      const interval = setInterval(fetchStats, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Use provided data if no token, otherwise use fetched stats
  const displayStats = stats || data || {
    totalUsers: 0,
    schoolLeaders: 0,
    learningSpecialists: 0,
    teachers: 0,
    parents: 0,
    admins: 0,
    students: 0,
    blogs: 0,
    contacts: 0,
    requests: 0,
  };

  const items = [
    { key: 'totalUsers', label: 'Total Users', value: displayStats.totalUsers, icon: 'users' },
    { key: 'schoolLeaders', label: 'School Leaders', value: displayStats.schoolLeaders, icon: 'leaders' },
    { key: 'learningSpecialists', label: 'Learning Specialists', value: displayStats.learningSpecialists, icon: 'specialists' },
    { key: 'teachers', label: 'Teachers', value: displayStats.teachers, icon: 'teachers' },
    { key: 'students', label: 'Students', value: displayStats.students, icon: 'students' },
    { key: 'parents', label: 'Parents', value: displayStats.parents, icon: 'parents' },
    { key: 'admins', label: 'Admin', value: displayStats.admins, icon: 'admin' },
    { key: 'blogs', label: 'Published Blogs', value: displayStats.blogs, icon: 'blogs' },
    { key: 'contacts', label: 'Contact Forms', value: displayStats.contacts, icon: 'contacts' },
    { key: 'requests', label: 'Pending Requests', value: displayStats.requests, icon: 'requests' },
  ];

  if (error && !stats) {
    return (
      <section aria-labelledby="dashboard-stats" className="mt-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p className="text-sm">{error}. Using fallback data.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="dashboard-stats" className="mt-6">
      <div className="flex flex-col md:flex-row items-start md:justify-between mb-4">
        <h2 id="dashboard-stats" className="text-lg font-semibold text-gray-800">
          Overview {loading && <span className="text-xs text-gray-500">(updating...)</span>}
        </h2>
        <LastUpdated timestamp={lastUpdated} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <div
            key={item.key}
            className={`bg-white rounded-lg shadow-sm p-3 md:p-4 flex items-start gap-4 ${
              loading ? 'opacity-60' : ''
            }`}
          >
            <div className="shrink-0">
              <Icon name={item.icon} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="lg:truncate">
                  <div className="text-xs font-medium text-gray-500">{item.label}</div>
                  <div className="mt-1">
                    {loading ? (
                      <div className="h-6 bg-gray-200 rounded animate-pulse w-12"></div>
                    ) : (
                      <Count value={item.value} />
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400">&nbsp;</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
