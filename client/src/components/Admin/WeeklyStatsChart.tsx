import type { WeeklyStats } from '@/fomat/adminType/adminPageTypes';
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';


const WeeklyStatsChart = ({ data }: { data: WeeklyStats[] }) => {
  

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const chartData = data.map(item => ({
    ...item,
    date: formatDate(item.date)
  }));

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">
          Thống kê hoạt động theo tuần
        </h1>
       
        
        <ResponsiveContainer width="100%" height={500}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              style={{ fontSize: '14px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '14px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="totalPosts" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Bài viết mới"
              dot={{ fill: '#3b82f6', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="newUsers" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Người dùng mới"
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
            />
            <Line 
              type="monotone" 
              dataKey="reportsToday" 
              stroke="#f59e0b" 
              strokeWidth={3}
              name="Báo cáo hôm nay"
              dot={{ fill: '#f59e0b', r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="text-blue-600 text-sm font-semibold">Bài viết mới</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {data.reduce((sum, item) => sum + item.totalPosts, 0)}
            </div>
            <div className="text-blue-600 text-xs mt-1">Tổng trong tuần</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
            <div className="text-green-600 text-sm font-semibold">Người dùng mới</div>
            <div className="text-2xl font-bold text-green-700 mt-1">
              {data.reduce((sum, item) => sum + item.newUsers, 0)}
            </div>
            <div className="text-green-600 text-xs mt-1">Tổng trong tuần</div>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
            <div className="text-amber-600 text-sm font-semibold">Báo cáo</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">
              {data.reduce((sum, item) => sum + item.reportsToday, 0)}
            </div>
            <div className="text-amber-600 text-xs mt-1">Tổng trong tuần</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStatsChart;