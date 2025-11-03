import React, { useState, useCallback, useEffect } from 'react';
import { Insight, Sentiment, Topic } from './types';
import Header from './components/Header';
import DataInputForm from './components/DataInputForm';
import StagingTable from './components/StagingTable';
import Dashboard from './components/Dashboard';
import {
  getStagedInsights,
  getProcessedInsights,
  addInsight,
  processInsight,
  deleteStagedInsight,
  clearStagedInsights,
  clearProcessedInsights,
  getAiSuggestion
} from './services/apiService';

const App: React.FC = () => {
  const [stagedInsights, setStagedInsights] = useState<Insight[]>([]);
  const [processedInsights, setProcessedInsights] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const staged = await getStagedInsights();
      const processed = await getProcessedInsights();
      setStagedInsights(staged);
      setProcessedInsights(processed);
    } catch (e) {
      console.error("Failed to load data:", e);
      setError("Could not load data from storage.");
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddInsight = useCallback(async (insightData: { source_url: string; raw_content: string }) => {
    await addInsight(insightData);
    await loadData();
  }, [loadData]);

  const handleProcessInsight = useCallback(async (id: string, sentiment: Sentiment, topic: Topic) => {
    await processInsight(id, sentiment, topic);
    await loadData();
  }, [loadData]);

  const handleDeleteStagedInsight = useCallback(async (id: string) => {
    await deleteStagedInsight(id);
    await loadData();
  }, [loadData]);

  const handleClearStaging = useCallback(async () => {
    await clearStagedInsights();
    await loadData();
  }, [loadData]);
    
  const handleClearProcessed = useCallback(async () => {
    await clearProcessedInsights();
    await loadData();
  }, [loadData]);

  const handleGetSuggestions = useCallback(async (content: string): Promise<{ sentiment: Sentiment; topic: Topic } | null> => {
    setError(null);
    try {
      const result = await getAiSuggestion(content);
      return result;
    } catch (e) {
      console.error("Error getting suggestions:", e);
      setError("Failed to get AI suggestions. Check API Key and try again.");
      return null;
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Header />
        
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <DataInputForm onAddInsight={handleAddInsight} />
            <Dashboard processedInsights={processedInsights} onClearData={handleClearProcessed} />
          </div>
          <div className="lg:col-span-3">
            <StagingTable
              insights={stagedInsights}
              onProcessInsight={handleProcessInsight}
              onDeleteInsight={handleDeleteStagedInsight}
              onGetSuggestions={handleGetSuggestions}
              onClearStaging={handleClearStaging}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
