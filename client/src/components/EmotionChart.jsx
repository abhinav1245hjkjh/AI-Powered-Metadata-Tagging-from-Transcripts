import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const emotionColors = {
  joy: '#067647',
  optimism: '#059669',
  enthusiasm: '#B54708',
  trust: '#3157D5',
  curiosity: '#175CD3',
  surprise: '#6941C6',
  sadness: '#475467',
  anger: '#B42318',
  fear: '#5925DC',
  disgust: '#912018',
  frustration: '#7A271A',
  neutral: '#344054',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const color = emotionColors[data.label.toLowerCase()] || '#3157D5';
    return (
      <div className="bg-white border border-[#E4E7EC] p-3 rounded-lg shadow-dropdown text-xs">
        <div className="flex items-center gap-2 font-bold text-[#101828] capitalize">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span>{data.label}</span>
        </div>
        <p className="text-[#3157D5] font-mono font-bold mt-1">
          Confidence: {(data.score * 100).toFixed(1)}%
        </p>
      </div>
    );
  }
  return null;
};

const EmotionChart = ({ emotions = [] }) => {
  if (!emotions || emotions.length === 0) {
    return (
      <div className="text-xs text-[#475467] italic py-6 text-center bg-[#F9FAFB] rounded-xl border border-[#E4E7EC]">
        No emotion distribution detected.
      </div>
    );
  }

  // Filter to emotions with meaningful score (> 1%) or top 6
  const activeEmotions = emotions.filter((e) => (e.score || 0) > 0.01);
  const displayEmotions = activeEmotions.length > 0 ? activeEmotions.slice(0, 8) : emotions.slice(0, 6);

  const chartData = displayEmotions.map((item) => ({
    label: item.label,
    score: item.score,
    percentage: Math.max(0, Math.min(100, Math.round(item.score * 100)))
  }));

  const containerHeight = Math.min(320, Math.max(200, chartData.length * 30));

  return (
    <div className="w-full pt-1" style={{ height: `${containerHeight}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 2, right: 24, left: 45, bottom: 2 }}
        >
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(val) => `${val}%`}
            stroke="#D0D5DD"
            fontSize={10}
            tick={{ fill: '#475467' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#D0D5DD"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={72}
            tick={{ fill: '#101828', textTransform: 'capitalize', fontWeight: 600 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={12}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={emotionColors[entry.label.toLowerCase()] || '#3157D5'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default EmotionChart;
