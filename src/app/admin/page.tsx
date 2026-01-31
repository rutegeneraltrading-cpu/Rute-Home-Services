'use client';

import React from 'react';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Products', value: '0', color: 'bg-blue-500' },
          { label: 'Total Services', value: '0', color: 'bg-green-500' },
          { label: 'Total Orders', value: '0', color: 'bg-purple-500' },
          { label: 'Total Bookings', value: '0', color: 'bg-orange-500' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-lg shadow p-6 border-l-4"
            style={{
              borderLeftColor: stat.color.replace('bg-', 'var(--color-'),
            }}
          >
            <p className="text-slate-600 text-sm font-medium">{stat.label}</p>
            <p className="text-3xl font-bold mt-2">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <p className="text-slate-600">No recent activity yet</p>
      </div>
    </div>
  );
}
