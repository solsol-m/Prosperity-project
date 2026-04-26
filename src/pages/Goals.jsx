import { useLanguage } from '../context/LanguageContext';

export default function AIInsights() {
  const { dir } = useLanguage();
  return (
    <div className="animate-fadeIn" style={{ padding: 24, direction: dir, fontFamily: "'Cairo', sans-serif" }}>
      <h2 style={{ color: '#0A192F' }}>الأهداف المالية</h2>
    </div>
  );
}
