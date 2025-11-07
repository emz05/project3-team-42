import React, { useEffect, useMemo, useState } from 'react';
import './css/manager-panel.css';
import { managerAPI } from '../../services/api.js';

const tabs = [
  'Dashboard',
  'Order History',
  'Employee Management',
  'Inventory',
  'Menu Management',
];

const ManagerPanel = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [drinks, setDrinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // current drink or null
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'add'

  const categories = useMemo(() => Array.from(new Set(drinks.map(d => d.category))).sort(), [drinks]);
  const imagePaths = useMemo(() => Array.from(new Set(drinks.map(d => d.drink_image_path))).sort(), [drinks]);

  const refreshDrinks = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await managerAPI.listDrinks();
      setDrinks(res.data || []);
    } catch (e) {
      setError('Failed to load drinks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'Menu Management') {
      refreshDrinks();
    }
  }, [activeTab]);

  return (
    <div className="manager-container">
      <aside className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
        <div className="sidebar-header">
          <div className="brand">Manager</div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>
        <nav className="menu">
          {tabs.map((t) => (
            <button
              key={t}
              className={t === activeTab ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveTab(t)}
              title={t}
            >
              <span className="menu-text">{t}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="content">
        {activeTab === 'Dashboard' && (
          <section>
            <h1>Dashboard</h1>
            <div className="grid">
              <div className="card placeholder">Sales Overview (placeholder)</div>
              <div className="card placeholder">Top Items (placeholder)</div>
              <div className="card placeholder">Peak Hours (placeholder)</div>
              <div className="card placeholder">Inventory Alerts (placeholder)</div>
            </div>
          </section>
        )}

        {activeTab === 'Order History' && (
          <section>
            <h1>Order History</h1>
            <div className="card placeholder">Order list and filters (placeholder)</div>
          </section>
        )}

        {activeTab === 'Employee Management' && (
          <section>
            <h1>Employee Management</h1>
            <div className="card placeholder">Employee table and roles (placeholder)</div>
          </section>
        )}

        {activeTab === 'Inventory' && (
          <section>
            <h1>Inventory</h1>
            <div className="card placeholder">Stock levels and adjustments (placeholder)</div>
          </section>
        )}

        {activeTab === 'Menu Management' && (
          <section>
            <h1>Menu Management</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <button className="menu-action" onClick={() => { setSelected({ category: categories[0] || '', drink_name: '', drink_price: '', drink_image_path: imagePaths[0] || '' }); setMode('add'); }}>+ Add Drink</button>
              {loading && <span className="muted">Loading…</span>}
              {error && <span className="error-text">{error}</span>}
            </div>
            <div className="grid">
              {drinks.map(d => (
                <button key={d.id} className="card drink-card" onClick={() => { setSelected(d); setMode('view'); }}>
                  <div className="drink-thumb">
                    {d.drink_image_path ? (
                      <img src={d.drink_image_path} alt={d.drink_name} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="placeholder-circle">{(d.drink_name || '?').slice(0,1)}</div>
                    )}
                  </div>
                  <div className="drink-meta">
                    <div className="drink-name">{d.drink_name}</div>
                    <div className="drink-sub">{d.category} • ${Number(d.drink_price).toFixed(2)}</div>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div className="panel">
                <div className="panel-header">
                  <div className="panel-title">{mode === 'add' ? 'Add Drink' : mode === 'edit' ? 'Edit Drink' : 'Drink Details'}</div>
                  <div className="panel-actions">
                    {mode === 'view' && (
                      <>
                        <button onClick={() => setMode('edit')}>Edit Drink</button>
                        <button className="danger" onClick={async () => { if (window.confirm('Delete this drink?')) { await managerAPI.deleteDrink(selected.id); setSelected(null); refreshDrinks(); } }}>Delete Drink</button>
                      </>
                    )}
                    <button onClick={() => { setSelected(null); setMode('view'); }}>Close</button>
                  </div>
                </div>

                <div className="panel-body">
                  <form onSubmit={(e) => e.preventDefault()} className="form">
                    <div className="form-row">
                      <label>ID</label>
                      <input type="text" value={selected.id ?? 'Auto'} disabled />
                    </div>
                    <div className="form-row">
                      <label>Category</label>
                      <select value={selected.category || ''} disabled={mode === 'view'} onChange={(e) => setSelected({ ...selected, category: e.target.value })}>
                        <option value="" disabled>Select a category</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Drink Name</label>
                      <input type="text" value={selected.drink_name || ''} disabled={mode === 'view'} onChange={(e) => setSelected({ ...selected, drink_name: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label>Drink Price</label>
                      <input type="number" step="0.01" value={selected.drink_price || ''} disabled={mode === 'view'} onChange={(e) => setSelected({ ...selected, drink_price: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <label>Image Path</label>
                      <select value={selected.drink_image_path || ''} disabled={mode === 'view'} onChange={(e) => setSelected({ ...selected, drink_image_path: e.target.value })}>
                        <option value="" disabled>Select an image</option>
                        {imagePaths.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="form-row">
                      <label>Seasonal</label>
                      <input type="text" value={selected.is_seasonal ? 'true' : 'false'} disabled />
                    </div>

                    {mode !== 'view' && (
                      <div className="form-actions">
                        <button type="button" onClick={async () => {
                          if (mode === 'edit') {
                            const payload = {
                              category: selected.category,
                              drink_name: selected.drink_name,
                              drink_price: Number(selected.drink_price),
                              drink_image_path: selected.drink_image_path,
                            };
                            const updated = await managerAPI.updateDrink(selected.id, payload);
                            setSelected(updated.data);
                            setMode('view');
                            refreshDrinks();
                          } else if (mode === 'add') {
                            const payload = {
                              category: selected.category,
                              drink_name: selected.drink_name,
                              drink_price: Number(selected.drink_price),
                              drink_image_path: selected.drink_image_path,
                            };
                            const created = await managerAPI.addDrink(payload);
                            setSelected(created.data);
                            setMode('view');
                            refreshDrinks();
                          }
                        }}>Save</button>
                        <button type="button" className="muted" onClick={() => setMode('view')}>Cancel</button>
                      </div>
                    )}
                  </form>
                </div>
              </div>
            )}

          </section>
        )}
      </main>
    </div>
  );
};

export default ManagerPanel;
