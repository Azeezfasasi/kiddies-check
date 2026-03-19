'use client';

import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import axios from 'axios';

const COLORS = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444',
  completed: '#3B82F6',
};

export default function QuoteChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuoteData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/quote');
        const quotes = response.data.quotes || response.data.data || response.data || [];

        // Count quotes by status
        const statusCounts = {
          pending: 0,
          approved: 0,
          rejected: 0,
          completed: 0,
        };

        if (Array.isArray(quotes)) {
          quotes.forEach((quote) => {
            const status = quote.status?.toLowerCase() || 'pending';
            if (statusCounts.hasOwnProperty(status)) {
              statusCounts[status]++;
            }
          });
        }

        // Transform to chart data
        const chartData = Object.entries(statusCounts)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
          }));

        setData(chartData);
        setError(null);
      } catch (err) {
        console.error('Error fetching quotes:', err);
        setError('Failed to load quote data');
      } finally {
        setLoading(false);
      }
    };

    fetchQuoteData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchQuoteData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
          <p className="mt-2 text-gray-600">Loading quote data...</p>
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
          <p className="text-lg font-semibold">No quote data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-300 w-full lg:w-[48%]">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Quote Status</h2>
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`${value} quotes`, 'Count']}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '8px',
            }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {data.map((item) => (
          <div key={item.name} className="bg-gray-50 p-4 rounded-lg text-center">
            <div
              className="w-3 h-3 rounded-full mx-auto mb-2"
              style={{ backgroundColor: COLORS[item.name.toLowerCase()] }}
            ></div>
            <p className="text-sm text-gray-600">{item.name}</p>
            <p className="text-2xl font-bold text-gray-800">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
