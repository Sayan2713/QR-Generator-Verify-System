import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, Users, ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 1. Fetch all events for the dropdown
  useEffect(() => {
    const fetchEvents = async () => {
      const res = await axios.get('https://qr-generator-verify-system.onrender.com/api/events/list');
      setEvents(res.data);
    };
    fetchEvents();
  }, []);

  // 2. Fetch real-time stats for the selected event
  useEffect(() => {
    let interval;

    const fetchStats = async () => {
      if (!selectedEventId) return;
      try {
        const res = await axios.get(`https://qr-generator-verify-system.onrender.com/api/events/stats/${selectedEventId}`);
        const { entry, exit, scammers } = res.data;

        // Transform API data into Recharts format
        const chartData = [
          { name: 'Total Entry', count: entry, color: '#3b82f6' },
          { name: 'Currently Left', count: exit, color: '#f97316' },
          { name: 'Scammers Caught', count: scammers, color: '#ef4444' }
        ];
        setStats(chartData);
      } catch (err) {
        console.error("Error fetching real-time stats:", err);
      }
    };

    if (selectedEventId) {
      fetchStats();
      // Auto-refresh stats every 5 seconds for "Live" feel
      interval = setInterval(fetchStats, 5000);
    }

    return () => clearInterval(interval);
  }, [selectedEventId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button onClick={() => navigate('/')} className="mb-6 flex items-center text-blue-600 font-medium hover:underline">
        <ArrowLeft size={20} className="mr-2" /> Back to Home
      </button>

      <div className="max-w-5xl mx-auto">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-3xl font-bold flex items-center text-gray-800">
              <LayoutDashboard className="mr-3 text-blue-600" /> Live Analytics
            </h2>
            
            <div className="flex items-center gap-3">
              {selectedEventId && <RefreshCw size={18} className="text-blue-500 animate-spin-slow" />}
              <select 
                className="border p-3 rounded-lg outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-500 bg-white"
                onChange={(e) => setSelectedEventId(e.target.value)}
                value={selectedEventId}
              >
                <option value="">-- Select Event to Track --</option>
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.name}</option>)}
              </select>
            </div>
          </div>

          {!selectedEventId ? (
            <div className="text-center py-24 text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <Users size={64} className="mx-auto mb-4 opacity-20" />
              <p className="text-lg">Select an event from the dropdown to start live tracking.</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* The Real-Time Bar Chart */}
              <div className="h-80 w-full bg-white rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                    <Tooltip 
                      cursor={{fill: '#f3f4f6'}} 
                      contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stat Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((item) => (
                  <div key={item.name} className="p-6 rounded-2xl border border-gray-100 bg-gray-50 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{item.name}</p>
                      <p className="text-4xl font-black text-gray-800">{item.count}</p>
                    </div>
                    {item.name === 'Scammers Caught' ? (
                      <ShieldAlert className="text-red-500" size={40} />
                    ) : (
                      <div className="h-10 w-10 rounded-full" style={{ backgroundColor: item.color + '20' }}>
                        <Users className="m-2" style={{ color: item.color }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;