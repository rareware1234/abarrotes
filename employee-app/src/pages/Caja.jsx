import React, { useState } from 'react';
import { FaCashRegister, FaMoneyBill, FaCreditCard, FaMobileAlt, FaArrowUp, FaArrowDown, FaDollarSign } from 'react-icons/fa';

const MOCK_MOVEMENTS = [
  { id: 1, type: 'sale', method: 'Efectivo', amount: 156.00, time: '10:30', ref: '#001' },
  { id: 2, type: 'sale', method: 'Tarjeta', amount: 89.50, time: '10:45', ref: '#002' },
  { id: 3, type: 'sale', method: 'Transferencia', amount: 234.00, time: '11:00', ref: '#003' },
  { id: 4, type: 'sale', method: 'Efectivo', amount: 45.00, time: '11:15', ref: '#004' },
  { id: 5, type: 'expense', method: 'Caja Chica', amount: -120.00, time: '09:30', ref: 'Gasto' },
  { id: 6, type: 'sale', method: 'Efectivo', amount: 320.00, time: '11:30', ref: '#005' },
];

const METHOD_ICONS = {
  'Efectivo': FaMoneyBill,
  'Tarjeta': FaCreditCard,
  'Transferencia': FaMobileAlt,
};

const Caja = () => {
  const [movements] = useState(MOCK_MOVEMENTS);
  const [showFloat, setShowFloat] = useState(false);

  const employeeName = sessionStorage.getItem('mobile_employeeName') || 'Empleado';

  const salesTotal = movements.filter(m => m.type === 'sale').reduce((s, m) => s + m.amount, 0);
  const expensesTotal = Math.abs(movements.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0));
  const cashTotal = movements.filter(m => m.type === 'sale' && m.method === 'Efectivo').reduce((s, m) => s + m.amount, 0);
  const cardTotal = movements.filter(m => m.type === 'sale' && m.method !== 'Efectivo').reduce((s, m) => s + m.amount, 0);
  const netTotal = salesTotal - expensesTotal;

  const TICKETS_PER_DAY = movements.filter(m => m.type === 'sale').length;
  const AVG_TICKET = TICKETS_PER_DAY > 0 ? salesTotal / TICKETS_PER_DAY : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: 0 }}>
      <div className="card" style={{ background: 'var(--primary)', padding: '20px', color: 'white', textAlign: 'center' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: 4 }}>Caja actual</div>
        <div style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-1px' }}>
          ${netTotal.toFixed(2)}
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: 4 }}>
          {TICKETS_PER_DAY} transacciones · Promedio ${AVG_TICKET.toFixed(0)}/ticket
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <div className="stat-card" style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
            <FaMoneyBill style={{ marginRight: 4 }} />${cashTotal.toFixed(0)}
          </div>
          <div className="stat-label">Efectivo</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--info)' }}>
            <FaCreditCard style={{ marginRight: 4 }} />${cardTotal.toFixed(0)}
          </div>
          <div className="stat-label">Tarjeta/Transfer</div>
        </div>
        <div className="stat-card" style={{ textAlign: 'center', padding: '12px' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>
            <FaArrowDown style={{ marginRight: 4 }} />${expensesTotal.toFixed(0)}
          </div>
          <div className="stat-label">Gastos</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-primary btn-block" onClick={() => setShowFloat(true)}>
          <FaDollarSign /> Corte de Caja
        </button>
        <button className="btn btn-outline-primary">
          <FaArrowUp /> Entrada
        </button>
        <button className="btn btn-outline-primary">
          <FaArrowDown /> Gasto
        </button>
      </div>

      <div className="card">
        <div className="card-header-section">
          <h3 className="card-title">Movimientos de hoy</h3>
          <span className="badge badge-muted">{movements.length}</span>
        </div>
        {movements.map(m => {
          const Icon = METHOD_ICONS[m.method] || FaMoneyBill;
          return (
            <div key={m.id} className="list-item" style={{ borderBottom: '1px solid var(--border-light)' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: m.type === 'sale' ? 'var(--success)20' : 'var(--danger)20',
                color: m.type === 'sale' ? 'var(--success)' : 'var(--danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 12, flexShrink: 0
              }}>
                <Icon style={{ fontSize: '0.9rem' }} />
              </div>
              <div className="list-item-content">
                <div className="list-item-title" style={{ fontSize: '0.9rem' }}>{m.method}</div>
                <div className="list-item-subtitle">Ref: {m.ref} · {m.time}</div>
              </div>
              <span style={{
                fontWeight: 800,
                color: m.amount >= 0 ? 'var(--success)' : 'var(--danger)',
                fontSize: '1rem'
              }}>
                {m.amount >= 0 ? '+' : ''}${Math.abs(m.amount).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>

      {showFloat && (
        <div className="card fade-up">
          <div className="card-header-section">
            <h3 className="card-title">Corte de Caja</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFloat(false)}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="card-body">
            {[
              { label: 'Total Efectivo', value: cashTotal },
              { label: 'Total Tarjeta', value: cardTotal },
              { label: 'Gastos', value: expensesTotal },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: 700 }}>${item.value.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', fontSize: '1.1rem' }}>
              <span style={{ fontWeight: 800, color: 'var(--primary)' }}>Total Neto</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)' }}>${(cashTotal - expensesTotal).toFixed(2)}</span>
            </div>
            <button className="btn btn-primary btn-block" onClick={() => setShowFloat(false)}>
              Confirmar Corte
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Caja;
