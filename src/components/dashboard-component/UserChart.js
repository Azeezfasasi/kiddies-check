'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

const ROLE_COLORS = {
  admin: '#1F2937',
  editor: '#3B82F6',
  viewer: '#10B981',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { role, count } = payload[0].payload;
    return (
      <div
        className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg"
      >
        <p className="font-semibold text-gray-800">{role}</p>
        <p className="text-gray-600">Count: {count} users</p>
      </div>
    );
  }
  return null;
};

export default function UserChart() {
  const { token } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRoles: 0,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const users = response.data.users || response.data.data || response.data || [];

        // Count users by role
        const roleCounts = {};
        if (Array.isArray(users)) {
          users.forEach((user) => {
            const role = user.role?.toLowerCase() || 'viewer';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          });
        }

        // Transform to chart data
        const chartData = Object.entries(roleCounts)
          .map(([name, value]) => ({
            role: name.charAt(0).toUpperCase() + name.slice(1),
            count: value,
            fill: ROLE_COLORS[name.toLowerCase()] || '#8884d8',
          }))
          .sort((a, b) => b.count - a.count);

        setData(chartData);
        setStats({
          totalUsers: users.length,
          totalRoles: Object.keys(roleCounts).length,
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    // Refresh data every 2 minutes
    const interval = setInterval(() => {
      if (token) fetchUserData();
    }, 120000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <p className="mt-2 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-semibold">No user data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300 w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">User Roles Distribution</h2>
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} height={36} />
          <Pie
            data={data}
            dataKey="count"
            nameKey="role"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 p-4 rounded-lg text-white">
          <p className="text-sm opacity-90">Total Users</p>
          <p className="text-3xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
          <p className="text-sm opacity-90">Total Roles</p>
          <p className="text-3xl font-bold">{stats.totalRoles}</p>
        </div>
        {data.map((item) => (
          <div
            key={item.role}
            className="p-4 rounded-lg text-white"
            style={{ backgroundColor: item.fill }}
          >
            <p className="text-sm opacity-90">{item.role}</p>
            <p className="text-3xl font-bold">{item.count}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
