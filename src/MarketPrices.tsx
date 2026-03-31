import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface CardPrice {
  id: string;
  card_name: string;
  card_id: string;
  grade: string;
  latest_price_sgd: number;
  latest_price_hkd: number;
  latest_price_jpy?: number;
  all_prices_sgd?: number[];
  source: string;
  url: string;
  scrape_time?: string;
  title?: string;
}

const SGD_TO_HKD = 6.1;
const JPY_TO_HKD = 0.052;

// Firestore REST API config (from firebase-applet-config.json)
const FIREBASE_PROJECT_ID = 'gen-lang-client-0326385388';
const FIREBASE_API_KEY = 'AIzaSyDSwhKXm7KqaHVO2kb2PQ6qmarySPcZyJ0';
const DATABASE_ID = 'abcd';
const COLLECTION = 'card_prices';

const MarketPrices: React.FC = () => {
  const [cards, setCards] = useState<CardPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      // Firestore REST API - using API key for public read access
      const response = await axios.post(
        `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${DATABASE_ID}/documents:runQuery`,
        {
          structuredQuery: {
            from: { collectionId: COLLECTION },
            orderBy: [{ field: { fieldPath: 'latest_price_hkd' }, direction: 'DESCENDING' }],
            limit: 50
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': FIREBASE_API_KEY,
            'X-Goog-User-Project': FIREBASE_PROJECT_ID
          }
        }
      );

      const fetchedCards: CardPrice[] = [];
      for (const doc of response.data) {
        if (doc.document) {
          const fields = doc.document.fields || {};
          const priceHKD = fields.latest_price_hkd?.integerValue || 
                           Math.round((fields.latest_price_sgd?.integerValue || 0) * SGD_TO_HKD);
          
          fetchedCards.push({
            id: doc.document.name.split('/').pop(),
            card_name: fields.card_name?.stringValue || fields.card_id?.stringValue || 'Unknown',
            card_id: fields.card_id?.stringValue || '',
            grade: fields.grade?.stringValue || '',
            latest_price_sgd: fields.latest_price_sgd?.integerValue || 0,
            latest_price_hkd: priceHKD,
            latest_price_jpy: fields.latest_price_jpy?.integerValue,
            all_prices_sgd: fields.all_prices_sgd?.arrayValue?.values?.map((v: any) => parseInt(v.stringValue)) || [],
            source: fields.source?.stringValue || 'Snkrdunk',
            url: fields.url?.stringValue || '',
            scrape_time: fields.scrape_time?.stringValue || '',
            title: fields.title?.stringValue || fields.card_name?.stringValue || '',
          });
        }
      }

      setCards(fetchedCards);
      if (fetchedCards.length > 0) {
        setLastUpdated(fetchedCards[0].scrape_time || new Date().toISOString());
      }
      setLoading(false);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching prices:', err.response?.data || err.message);
      setError(err.response?.data?.error?.message || err.message || 'Failed to load prices');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Find the Van Gogh Pikachu (highest price or specific card)
  const vanGoghCard = cards.find(c => 
    c.title?.toLowerCase().includes('van gogh') || 
    c.card_name?.toLowerCase().includes('van gogh') ||
    c.title?.toLowerCase().includes('pikachu with grey felt') ||
    c.card_id?.includes('146897')
  );

  // Sort by HKD price descending
  const sortedCards = [...cards].sort((a, b) => b.latest_price_hkd - a.latest_price_hkd);

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-HK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 font-medium">載入市場數據...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">載入失敗</h2>
          <p className="text-gray-400 text-sm mb-4">{error}</p>
          <button 
            onClick={fetchPrices}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold transition-colors"
          >
            重試
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🎴 市場行情</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              即時追蹤熱門卡牌價格
              {lastUpdated && (
                <span className="ml-2 text-gray-500">
                  · 更新於 {new Date(lastUpdated).toLocaleTimeString('zh-HK')}
                </span>
              )}
            </p>
          </div>
          <button 
            onClick={fetchPrices}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
          >
            重新整理
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Hero Card - Van Gogh Pikachu */}
        {vanGoghCard && (
          <div className="mb-8">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-amber-900/40 via-orange-900/20 to-yellow-900/10 border border-amber-500/20 p-8 sm:p-12">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 20% 50%, #f59e0b 0%, transparent 50%), radial-gradient(circle at 80% 50%, #ea580c 0%, transparent 50%)'
                }}></div>
              </div>
              
              <div className="relative flex flex-col lg:flex-row items-center gap-8">
                {/* Card Image Placeholder */}
                <div className="w-48 h-64 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl border border-amber-500/30 flex items-center justify-center shrink-0">
                  <span className="text-6xl">⚡</span>
                </div>
                
                <div className="flex-1 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/30">
                    ⭐ 最高價卡牌
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
                    {vanGoghCard.title || vanGoghCard.card_name}
                  </h2>
                  <p className="text-amber-200/70 text-sm mb-6">
                    {vanGoghCard.grade} · {vanGoghCard.source}
                  </p>
                  
                  {/* Big Price */}
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-1">最新成交價 (HKD)</p>
                    <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                      <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-400 tracking-tighter">
                        HK$
                      </span>
                      <span className="text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-200 to-yellow-400 tracking-tighter leading-none">
                        {formatPrice(vanGoghCard.latest_price_hkd)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-sm">
                    {vanGoghCard.latest_price_sgd > 0 && (
                      <div className="px-4 py-2 bg-white/10 rounded-xl">
                        <span className="text-gray-400">SGD </span>
                        <span className="font-bold text-white">${formatPrice(vanGoghCard.latest_price_sgd)}</span>
                      </div>
                    )}
                    {vanGoghCard.latest_price_jpy && vanGoghCard.latest_price_jpy > 0 && (
                      <div className="px-4 py-2 bg-white/10 rounded-xl">
                        <span className="text-gray-400">JPY </span>
                        <span className="font-bold text-white">¥{formatPrice(vanGoghCard.latest_price_jpy)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bento Grid */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-4">🔥 熱門卡牌</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedCards.map((card, index) => {
              const isTop = index === 0;
              return (
                <div 
                  key={card.id}
                  className={`group relative overflow-hidden rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
                    isTop 
                      ? 'bg-gradient-to-br from-yellow-900/40 to-orange-900/20 border-yellow-500/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Rank Badge */}
                  <div className={`absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black z-10 ${
                    isTop ? 'bg-amber-500 text-black' : 'bg-white/20 text-white/60'
                  }`}>
                    {index + 1}
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    {/* Card Visual */}
                    <div className={`w-full aspect-[3/4] rounded-2xl mb-4 flex items-center justify-center overflow-hidden ${
                      isTop 
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20' 
                        : 'bg-gray-800/50'
                    }`}>
                      <span className="text-5xl">
                        {card.title?.toLowerCase().includes('charizard') ? '🔥' :
                         card.title?.toLowerCase().includes('pikachu') || card.title?.toLowerCase().includes('van gogh') ? '⚡' :
                         card.title?.toLowerCase().includes('lugia') ? '🦅' :
                         card.title?.toLowerCase().includes('rayquaza') ? '🐉' :
                         card.title?.toLowerCase().includes('giratina') ? '👾' :
                         card.title?.toLowerCase().includes('mewtwo') ? '🧬' :
                         card.title?.toLowerCase().includes('gengar') ? '👻' :
                         card.title?.toLowerCase().includes('dragonite') ? '🐲' : '🎴'}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="font-bold text-white text-sm leading-tight mb-1 line-clamp-2 group-hover:text-blue-300 transition-colors">
                      {card.title || card.card_name}
                    </h3>
                    
                    {/* Grade */}
                    <p className="text-gray-500 text-xs mb-3">{card.grade} · {card.source}</p>
                    
                    {/* Price */}
                    <div className="border-t border-white/10 pt-3">
                      <p className="text-gray-400 text-xs mb-0.5">HKD</p>
                      <p className={`font-black tracking-tight leading-none ${
                        isTop 
                          ? 'text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400' 
                          : 'text-2xl text-white'
                      }`}>
                        ${formatPrice(card.latest_price_hkd)}
                      </p>
                      {card.latest_price_sgd > 0 && (
                        <p className="text-gray-500 text-xs mt-1">
                          ≈ SGD ${formatPrice(card.latest_price_sgd)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Source Link */}
                  {card.url && (
                    <a 
                      href={card.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty State */}
        {cards.length === 0 && !loading && (
          <div className="text-center py-24">
            <span className="text-6xl mb-4 block">🎴</span>
            <h3 className="text-xl font-bold text-white mb-2">暫無價格數據</h3>
            <p className="text-gray-400">爬蟲尚未抓取任何卡牌價格</p>
            <p className="text-gray-500 text-sm mt-2">請確保 Firebase Firestore 已開放大眾讀取權限</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-gray-500 text-sm">
            數據來源：Snkrdunk · 每 5 分鐘自動更新
          </p>
          <p className="text-gray-600 text-xs mt-2">
            Firebase Database: abcd · Collection: card_prices
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketPrices;
