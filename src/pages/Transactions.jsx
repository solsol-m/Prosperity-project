/**
 * Transactions Page — Light Theme (Style Guide)
 */

import { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, Download } from 'lucide-react';

const ALL_TX = [
  { id: 1, name: 'راتب أبريل',       category: 'دخل',     date: '٢٥ أبريل ٢٠٢٦', amount: 12500, type: 'in'  },
  { id: 2, name: 'إيجار الشقة',      category: 'سكن',     date: '٢٤ أبريل ٢٠٢٦', amount: 2200,  type: 'out' },
  { id: 3, name: 'فاتورة الكهرباء',  category: 'خدمات',   date: '٢٣ أبريل ٢٠٢٦', amount: 350,   type: 'out' },
  { id: 4, name: 'عائد استثمار',     category: 'استثمار', date: '٢٢ أبريل ٢٠٢٦', amount: 800,   type: 'in'  },
  { id: 5, name: 'تسوّق مول',        category: 'تسوق',    date: '٢١ أبريل ٢٠٢٦', amount: 640,   type: 'out' },
  { id: 6, name: 'اشتراك نتفليكس',   category: 'ترفيه',   date: '٢٠ أبريل ٢٠٢٦', amount: 65,    type: 'out' },
  { id: 7, name: 'تحويل من سلمى',   category: 'دخل',     date: '١٩ أبريل ٢٠٢٦', amount: 500,   type: 'in'  },
  { id: 8, name: 'مطعم العائلة',     category: 'مطاعم',   date: '١٨ أبريل ٢٠٢٦', amount: 280,   type: 'out' },
];

// Badge colors per category
const CAT = {
  دخل:     { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  سكن:     { bg: '#EFF6FF', color: '#1E3A8A', border: '#BFDBFE' },
  خدمات:   { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  استثمار: { bg: '#F5F3FF', color: '#4C1D95', border: '#DDD6FE' },
  تسوق:    { bg: '#FDF2F8', color: '#831843', border: '#FBCFE8' },
  ترفيه:   { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE' },
  مطاعم:   { bg: '#FFF7ED', color: '#9A3412', border: '#FED7AA' },
};

function TxRow({ tx }) {
  const isIn = tx.type === 'in';
  const cat  = CAT[tx.category] || { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' };

  return (
    <tr
      style={{ transition: 'background 0.15s', cursor: 'default' }}
      onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Name + Date */}
      <td style={{ padding: '13px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: isIn ? '#ECFDF5' : '#FEF2F2',
            border: `1px solid ${isIn ? '#A7F3D0' : '#FECACA'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isIn
              ? <ArrowDownLeft size={15} color="#10B981" />
              : <ArrowUpRight  size={15} color="#EF4444" />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0A192F', fontFamily: "'Manrope', sans-serif" }}>{tx.name}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: "'Inter', sans-serif", marginTop: 2 }}>{tx.date}</div>
          </div>
        </div>
      </td>

      {/* Category Badge */}
      <td style={{ padding: '13px 18px' }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          padding: '3px 10px', borderRadius: 20,
          fontFamily: "'Inter', sans-serif",
          background: cat.bg,
          color: cat.color,
          border: `1px solid ${cat.border}`,
        }}>
          {tx.category}
        </span>
      </td>

      {/* Amount */}
      <td style={{
        padding: '13px 18px', textAlign: 'left',
        fontSize: 14, fontWeight: 700,
        fontFamily: "'Manrope', sans-serif",
        color: isIn ? '#059669' : '#DC2626',
      }}>
        {isIn ? '+' : '-'}{tx.amount.toLocaleString('ar-SA')} ر.س
      </td>
    </tr>
  );
}

export default function Transactions() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const list = ALL_TX.filter(tx => {
    const q = tx.name.includes(search) || tx.category.includes(search);
    const f = filter === 'all' || tx.type === filter;
    return q && f;
  });

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Manrope', sans-serif", fontSize: 18, fontWeight: 800, color: '#0A192F', margin: 0 }}>سجل المعاملات</h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>{list.length} معاملة</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outlined">
            <Download size={14} />
            تصدير
          </button>
          <button className="btn-primary">
            <ArrowUpRight size={14} />
            معاملة جديدة
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#F8FAFC', border: '1.5px solid #E2E8F0',
          borderRadius: 8, padding: '8px 14px', flex: 1, minWidth: 180,
        }}>
          <Search size={14} color="#94A3B8" />
          <input
            type="text"
            placeholder="بحث في المعاملات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'none', border: 'none', outline: 'none',
              fontFamily: "'Inter', sans-serif", fontSize: 13,
              color: '#0A192F', direction: 'rtl', width: '100%',
            }}
          />
        </div>

        {/* Type Filter Buttons (من الـ Style Guide: Outlined style) */}
        {[{ key: 'all', label: 'الكل' }, { key: 'in', label: 'وارد' }, { key: 'out', label: 'صادر' }].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 18px', borderRadius: 8,
              fontFamily: "'Manrope', sans-serif",
              fontSize: 13, cursor: 'pointer', fontWeight: 600,
              background: filter === f.key ? '#0A192F' : 'transparent',
              color:      filter === f.key ? '#FFFFFF' : '#64748B',
              border:     filter === f.key ? '2px solid #0A192F' : '2px solid #E2E8F0',
              transition: 'all 0.18s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', background: '#FAFBFC' }}>
              <th style={{ padding: '11px 18px', fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: "'Inter', sans-serif", textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 }}>المعاملة</th>
              <th style={{ padding: '11px 18px', fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: "'Inter', sans-serif", textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 }}>التصنيف</th>
              <th style={{ padding: '11px 18px', fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: "'Inter', sans-serif", textAlign: 'left',  textTransform: 'uppercase', letterSpacing: 0.5 }}>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0
              ? list.map(tx => <TxRow key={tx.id} tx={tx} />)
              : (
                <tr>
                  <td colSpan={3} style={{
                    padding: 48, textAlign: 'center',
                    color: '#94A3B8', fontSize: 14,
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
