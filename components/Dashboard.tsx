
import React, { useMemo } from 'react';
import { Insight, Sentiment, Topic } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrashIcon } from './icons/TrashIcon';

interface DashboardProps {
  processedInsights: Insight[];
  onClearData: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 p-2 border border-gray-600 rounded-md shadow-lg">
        <p className="label text-gray-200">{`${label} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ processedInsights, onClearData }) => {
  const sentimentData = useMemo(() => {
    const counts = processedInsights.reduce((acc, insight) => {
      if (insight.sentiment) {
        acc[insight.sentiment] = (acc[insight.sentiment] || 0) + 1;
      }
      return acc;
    }, {} as Record<Sentiment, number>);

    return Object.values(Sentiment).map(sentiment => ({
      name: sentiment,
      count: counts[sentiment] || 0,
    }));
  }, [processedInsights]);

  const topicData = useMemo(() => {
    const counts = processedInsights.reduce((acc, insight) => {
      if (insight.topic) {
        acc[insight.topic] = (acc[insight.topic] || 0) + 1;
      }
      return acc;
    }, {} as Record<Topic, number>);

    return Object.values(Topic).map(topic => ({
      name: topic,
      count: counts[topic] || 0,
    })).sort((a, b) => b.count - a.count);
  }, [processedInsights]);

  return (
    <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Processed Insights Dashboard</h2>
        <button
          onClick={onClearData}
          disabled={processedInsights.length === 0}
          className="flex items-center text-sm bg-red-800 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          <TrashIcon className="h-4 w-4 mr-1"/>
          Clear
        </button>
      </div>

      <div className="space-y-8">
        <div>
          <h3 className="text-md font-medium text-gray-300 mb-2">Sentiment Distribution</h3>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={sentimentData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="name" tick={{ fill: '#A0AEC0' }} />
                <YAxis allowDecimals={false} tick={{ fill: '#A0AEC0' }} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(100, 116, 139, 0.1)'}}/>
                <Bar dataKey="count" fill="#2DD4BF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <h3 className="text-md font-medium text-gray-300 mb-2">Topic Distribution</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={topicData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#A0AEC0' }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#A0AEC0' }} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(100, 116, 139, 0.1)'}}/>
                <Bar dataKey="count" fill="#0EA5E9" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
