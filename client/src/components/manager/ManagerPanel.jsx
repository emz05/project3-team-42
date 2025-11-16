import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './css/manager-panel.css';
import { managerAPI } from '../../services/api.js';
import LanguageDropdown from "../common/LanguageDropdown.jsx";

const LOW_STOCK_THRESHOLD = 20;
const getTodayKey = () => new Date().toISOString().slice(0, 10);

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const ChartCard = ({ title, children, action, subtitle }) => (
  <div className="card chart-card">
    <div className="card-title-row">
      <div>
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-subtitle">{subtitle}</div>}
      </div>
      {action && <div className="card-action">{action}</div>}
    </div>
    {children}
  </div>
);

const VerticalBarChart = ({
  data = [],
  labelKey = 'label',
  valueKey = 'value',
  detailKey,
  limit = 10,
  valueFormatter = formatNumber,
}) => {
  if (!data || data.length === 0) return <div className="muted">No data available</div>;
  const trimmed = data.slice(-limit);
  const maxValue = Math.max(...trimmed.map((item) => Number(item[valueKey]) || 0)) || 1;

  return (
    <div className="bar-chart vertical">
      {trimmed.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const height = (value / maxValue) * 100;
        return (
          <div className="bar-col" key={`${item[labelKey]}-${item[valueKey]}-${item[detailKey] || ''}`}>
            <div className="bar" style={{ height: `${height || 0}%` }} aria-label={`${item[labelKey]} ${valueFormatter(value)}`} />
            <div className="bar-value">{valueFormatter(value)}</div>
            <div className="bar-label">
              <span>{item[labelKey]}</span>
              {detailKey && <small>{item[detailKey]}</small>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HorizontalBarChart = ({
  data = [],
  labelKey = 'label',
  valueKey = 'value',
  detailKey,
  limit = 8,
  valueFormatter = formatNumber,
  accent = false,
}) => {
  if (!data || data.length === 0) return <div className="muted">No data available</div>;
  const trimmed = data.slice(0, limit);
  const maxValue = Math.max(...trimmed.map((item) => Number(item[valueKey]) || 0)) || 1;

  return (
    <div className="horizontal-bar-chart">
      {trimmed.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = (value / maxValue) * 100;
        return (
          <div className="horizontal-row" key={`${item[labelKey]}-${value}`}>
            <div className="row-label">
              <span>{item[labelKey]}</span>
              {detailKey && <small>{item[detailKey]}</small>}
            </div>
            <div className="row-bar">
              <div className={accent ? 'row-bar-fill accent' : 'row-bar-fill'} style={{ width: `${width || 0}%` }} />
            </div>
            <div className="row-value">{valueFormatter(value)}</div>
          </div>
        );
      })}
    </div>
  );
};

const DualHorizontalBarChart = ({
  data = [],
  labelKey = 'label',
  primaryKey,
  secondaryKey,
  primaryLabel = 'Orders',
  secondaryLabel = 'Revenue',
  primaryFormatter = formatNumber,
  secondaryFormatter = formatCurrency,
  primaryColor = '#2563eb',
  secondaryColor = '#f97316',
  limit = 5,
}) => {
  if (!data || data.length === 0) return <div className="muted">No data available</div>;
  const trimmed = data.slice(0, limit);
  const maxPrimary = Math.max(...trimmed.map((item) => Number(item[primaryKey]) || 0)) || 1;
  const maxSecondary = Math.max(...trimmed.map((item) => Number(item[secondaryKey]) || 0)) || 1;

  return (
    <div className="dual-bar-chart">
      {trimmed.map((item) => {
        const primary = Number(item[primaryKey]) || 0;
        const secondary = Number(item[secondaryKey]) || 0;
        const primaryWidth = (primary / maxPrimary) * 100;
        const secondaryWidth = (secondary / maxSecondary) * 100;
        return (
          <div className="dual-row" key={`${item[labelKey]}-${primary}-${secondary}`}>
            <div className="row-label">
              <span>{item[labelKey]}</span>
              {item.detail && <small>{item.detail}</small>}
            </div>
            <div className="dual-bars">
              <div className="dual-bar">
                <span className="muted tiny">{primaryLabel}</span>
                <div className="row-bar subtle">
                  <div className="row-bar-fill" style={{ width: `${primaryWidth}%`, background: primaryColor }} />
                </div>
                <span className="row-value">{primaryFormatter(primary)}</span>
              </div>
              <div className="dual-bar">
                <span className="muted tiny">{secondaryLabel}</span>
                <div className="row-bar subtle">
                  <div className="row-bar-fill" style={{ width: `${secondaryWidth}%`, background: secondaryColor }} />
                </div>
                <span className="row-value">{secondaryFormatter(secondary)}</span>
              </div>
            </div>
          </div>
        );
      })}
      <div className="dual-legend">
        <span><span className="legend-dot" style={{ background: primaryColor }} />{primaryLabel}</span>
        <span><span className="legend-dot" style={{ background: secondaryColor }} />{secondaryLabel}</span>
      </div>
    </div>
  );
};

const SparklineChart = ({ data = [], labelKey = 'label', valueKey = 'value' }) => {
  if (!data || data.length === 0) return <div className="muted">No data available</div>;
  const trimmed = data.slice(0, 12);
  const maxValue = Math.max(...trimmed.map((item) => Number(item[valueKey]) || 0)) || 1;
  const coords = trimmed.map((item, idx) => {
    const value = Number(item[valueKey]) || 0;
    const x = trimmed.length === 1 ? 50 : (idx / (trimmed.length - 1)) * 100;
    const y = 100 - (value / maxValue) * 100;
    return { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)), label: item[labelKey], value };
  });
  const linePoints = coords.map((pt) => `${pt.x},${pt.y}`).join(' ');
  const areaPoints = `0,100 ${linePoints} 100,100`;

  return (
    <div className="sparkline-chart">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <polygon className="sparkline-fill" points={areaPoints} />
        <polyline className="sparkline-line" points={linePoints} />
      </svg>
      <div className="sparkline-labels">
        {coords.map((pt) => (
          <span key={`${pt.label}-${pt.x}`}>{pt.label}</span>
        ))}
      </div>
    </div>
  );
};

const LowStockChart = ({ data = [] }) => {
  if (!data || data.length === 0) return <div className="muted">Stock levels look good.</div>;
  return (
    <div className="low-stock-chart">
      {data.map((item) => {
        const qty = Number(item.curramount) || 0;
        const width = Math.min((qty / LOW_STOCK_THRESHOLD) * 100, 100);
        return (
          <div className="low-stock-row" key={item.item}>
            <div className="low-stock-head">
              <span className="low-stock-item">{item.item}</span>
              <span className="low-stock-qty">{formatNumber(qty)} left</span>
            </div>
            <div className="row-bar danger">
              <div className="row-bar-fill" style={{ width: `${width}%` }} />
            </div>
            <div className="low-stock-meta">
              {item.restockamount != null && <span>Restock: {formatNumber(item.restockamount)}</span>}
              {item.unitcost != null && <span>Unit: {formatCurrency(item.unitcost)}</span>}
              {item.vendor && <span>Vendor: {item.vendor}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ReportCard = ({
  title,
  report,
  loading,
  onRun,
  canRun = true,
  lastRunDate,
}) => (
  <div className="card report-card large">
    <div className="card-title-row">
      <div>
        <div className="card-title">{title}</div>
        <div className="card-subtitle">Last run: {lastRunDate ? formatDate(lastRunDate) : 'Never'}</div>
      </div>
      {onRun && (
        <button className="pill-button small" onClick={onRun} disabled={!canRun}>
          {canRun ? 'Run' : 'Ran Today'}
        </button>
      )}
    </div>
    {loading ? (
      <div className="muted">Loading…</div>
    ) : report ? (
      <div className="report-body large">
        <div className="report-row">
          <span className="muted tiny">Sales</span>
          <strong>{formatCurrency(report.total_sales)}</strong>
        </div>
        <div className="report-row">
          <span className="muted tiny">Orders</span>
          <strong>{formatNumber(report.total_orders)}</strong>
        </div>
        <div className="report-row">
          <span className="muted tiny">Avg Ticket</span>
          <strong>{formatCurrency(report.avg_order_value)}</strong>
        </div>
        <div className="report-meta-large">
          <div>
            <span className="muted tiny">Report Date </span>
            <strong>{formatDate(report.report_date)}</strong>
          </div>
          <div>
            <span className="muted tiny">First Sale </span>
            <strong>{report.first_transaction_time || '—'}</strong>
          </div>
          <div>
            <span className="muted tiny">Last Sale </span>
            <strong>{report.last_transaction_time || '—'}</strong>
          </div>
        </div>
        <div className="payment-breakdown">
          <div className="payment-heading">Payment Mix</div>
          {Array.isArray(report.payment_breakdown) && report.payment_breakdown.length > 0 ? (
            report.payment_breakdown.map((p) => (
              <div className="payment-row bold" key={p.payment_method || 'Unknown'}>
                <span>{p.payment_method || 'Unknown'}</span>
                <span>{formatNumber(p.total_orders)} orders</span>
                <strong>{formatCurrency(p.total_sales)}</strong>
              </div>
            ))
          ) : (
            <div className="muted tiny">No payment data</div>
          )}
        </div>
      </div>
    ) : (
      <div className="muted">No report yet</div>
    )}
  </div>
);

const emptyReportRunState = { x: null, z: null };

const readReportRunState = () => {
  if (typeof window === 'undefined') return emptyReportRunState;
  try {
    const saved = window.localStorage.getItem('managerReportRunState');
    return saved ? { ...emptyReportRunState, ...JSON.parse(saved) } : emptyReportRunState;
  } catch (e) {
    console.error('Failed to read report run state', e);
    return emptyReportRunState;
  }
};

const dashboardDefaults = {
  weeklySales: [],
  hourlySales: [],
  peakDay: null,
  employees: [],
  revenuePerEmployee: [],
  ordersPerEmployee: [],
  lowStockInventory: [],
  drinkCounts: [],
  ordersPerCategory: [],
  salesPerDrink: [],
  cheapDrinks: [],
  highestReceipt: null,
  xReport: null,
  zReport: null,
};

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
  const [drinksLoading, setDrinksLoading] = useState(false);
  const [menuError, setMenuError] = useState('');
  const [selected, setSelected] = useState(null); // current drink or null
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'add'
  const [dashboardData, setDashboardData] = useState(dashboardDefaults);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [reportRunState, setReportRunState] = useState(() => readReportRunState());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const categories = useMemo(() => Array.from(new Set(drinks.map(d => d.category))).sort(), [drinks]);
  const imagePaths = useMemo(() => Array.from(new Set(drinks.map(d => d.drink_image_path))).sort(), [drinks]);

  const refreshDrinks = async () => {
    try {
      setDrinksLoading(true);
      setMenuError('');
      const res = await managerAPI.listDrinks();
      setDrinks(res.data || []);
    } catch (e) {
      console.error('Manager get drinks', e);
      setMenuError('Failed to load drinks');
    } finally {
      setDrinksLoading(false);
    }
  };

  const loadDashboard = useCallback(async () => {
    try {
      setDashboardError('');
      setDashboardLoading(true);
      const res = await managerAPI.dashboard();
      setDashboardData({ ...dashboardDefaults, ...(res.data || {}) });
    } catch (e) {
      console.error('Manager load dashboard', e);
      setDashboardData(dashboardDefaults);
      setDashboardError('Failed to load dashboard');
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('managerReportRunState', JSON.stringify(reportRunState));
    }
  }, [reportRunState]);

  useEffect(() => {
    if (activeTab === 'Menu Management') {
      refreshDrinks();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Dashboard') {
      loadDashboard();
    }
  }, [activeTab, loadDashboard]);

  const {
    weeklySales,
    hourlySales,
    peakDay,
    employees,
    revenuePerEmployee,
    ordersPerEmployee,
    lowStockInventory,
    drinkCounts,
    ordersPerCategory,
    salesPerDrink,
    highestReceipt,
    xReport,
    zReport,
  } = dashboardData;

  const canRunReport = (type) => {
    const lastRun = reportRunState[type];
    return !lastRun || lastRun !== getTodayKey();
  };

  const handleRunReport = async (type) => {
    if (!canRunReport(type)) return;
    await loadDashboard();
    const today = getTodayKey();
    setReportRunState((prev) => ({ ...prev, [type]: today }));
  };

  const handleDeleteDrink = async () => {
    if (!selected) return;
    try {
      setDeletePending(true);
      setDeleteError('');
      await managerAPI.deleteDrink(selected.id);
      setDeleteConfirmOpen(false);
      closeModal();
      refreshDrinks();
    } catch (e) {
      const message = e?.response?.status === 500 || e?.response?.data?.error
        ? 'Cannot delete this drink because it has existing order history.'
        : 'Failed to delete drink. Please try again.';
      setDeleteError(message);
    } finally {
      setDeletePending(false);
    }
  };

  const closeModal = () => {
    setSelected(null);
    setMode('view');
    setDeleteConfirmOpen(false);
    setDeletePending(false);
    setDeleteError('');
  };

  const weeklyChartData = weeklySales.map((row) => ({
    label: `W${String(row.week).padStart(2, '0')}`,
    detail: row.year,
    value: Number(row.total_orders) || 0,
  }));

  const hourlyOrdersData = hourlySales.map((row) => ({
    label: row.hour_of_day,
    value: Number(row.total_orders) || 0,
  }));

  const topHour = hourlySales.reduce((best, row) => {
    if (!best) return row;
    return Number(row.total_orders) > Number(best.total_orders) ? row : best;
  }, null);

  const drinkCountChartData = drinkCounts.map((row) => ({
    label: row.category,
    value: Number(row.drink_count) || 0,
  }));

  const ordersPerCategoryData = ordersPerCategory.map((row) => ({
    label: row.category,
    value: Number(row.total_orders) || 0,
  }));

  const salesPerDrinkChartData = salesPerDrink.map((row) => ({
    label: row.drink_name,
    detail: `${formatNumber(row.total_orders)} orders`,
    value: Number(row.total_revenue) || 0,
  }));

  const employeePerformanceData = ordersPerEmployee.map((row) => ({
    label: `${row.first_name} ${row.last_name}`,
    detail: `ID ${row.employee_id}`,
    orders: Number(row.total_orders) || 0,
    revenue: Number(row.total_revenue) || 0,
  }));

  const highestReceiptAmount = Number(highestReceipt?.max_receipt) || 0;
  const peakSum = Number(peakDay?.sum) || 0;
  const peakGauge = peakSum
    ? Math.min((peakSum / (highestReceiptAmount || peakSum)) * 100, 100)
    : 0;
  const peakDate = peakDay ? formatDate(peakDay.transaction_date) : '—';
  const highestReceiptDate = highestReceipt ? formatDate(highestReceipt.transaction_date) : '—';

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
          <div className="manager-language-dropdown"><LanguageDropdown /></div>
      </aside>


      <main className="content">
        {activeTab === 'Dashboard' && (
          <section className="dashboard-view">
            <div className="section-header">
              <div>
                <h1>Dashboard</h1>
              </div>
              <button className="pill-button" onClick={loadDashboard} disabled={dashboardLoading}>
                {dashboardLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            {dashboardError && <div className="alert error">{dashboardError}</div>}

            <div className="dashboard-section sales-tall">
              <div className="section-heading">
                <h2>Sales & Analytics</h2>
              </div>
              <div className="dashboard-grid charts">
                <ChartCard title="Weekly Sales Trend" subtitle="Orders per ISO week">
                  <VerticalBarChart
                    data={weeklyChartData}
                    labelKey="label"
                    valueKey="value"
                    detailKey="detail"
                    valueFormatter={formatNumber}
                  />
                </ChartCard>

                <ChartCard title="Hourly Orders" subtitle="Order count grouped by hour">
                  <SparklineChart data={hourlyOrdersData} labelKey="label" valueKey="value" />
                  <div className="chart-stats">
                    <div>
                      <span className="muted tiny">Busiest Hour</span>
                      <strong>{topHour?.hour_of_day || '—'}</strong>
                    </div>
                    <div>
                      <span className="muted tiny">Orders</span>
                      <strong>{topHour ? formatNumber(topHour.total_orders) : '—'}</strong>
                    </div>
                    <div>
                      <span className="muted tiny">Revenue</span>
                      <strong>{topHour ? formatCurrency(topHour.total_sales) : '—'}</strong>
                    </div>
                  </div>
                </ChartCard>

                <ChartCard title="Peak Sales Day" subtitle="Top 10 orders summed per day">
                  {dashboardLoading && !peakDay ? (
                    <div className="muted">Loading…</div>
                  ) : peakDay ? (
                    <div className="peak-card-body">
                      <div
                        className="radial-indicator"
                        style={{ backgroundImage: `conic-gradient(var(--brand) ${peakGauge}%, #f3f4f6 0)` }}
                      >
                        <div className="radial-inner">
                          <div className="radial-value">{formatCurrency(peakDay.sum)}</div>
                          <span className="muted tiny">Top revenue</span>
                        </div>
                      </div>
                      <div className="peak-meta">
                        <div>
                          <span className="muted tiny">Date </span>
                          <strong>{peakDate}</strong>
                        </div>
                        <div>
                          <span className="muted tiny">vs Highest Ticket</span>
                          <strong>{highestReceipt ? formatCurrency(highestReceipt.max_receipt) : '—'}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="muted">No peak day identified</div>
                  )}
                </ChartCard>
              </div>
            </div>
            <div className="dashboard-section">
              <div className="section-heading">
                <h2>Drink Performance</h2>
              </div>
              <div className="dashboard-grid charts">
                <ChartCard title="Drinks per Category">
                  <VerticalBarChart
                    data={drinkCountChartData}
                    labelKey="label"
                    valueKey="value"
                    valueFormatter={formatNumber}
                  />
                </ChartCard>
                <ChartCard title="Orders per Category">
                  <VerticalBarChart
                    data={ordersPerCategoryData}
                    labelKey="label"
                    valueKey="value"
                    valueFormatter={formatNumber}
                  />
                </ChartCard>
                <ChartCard title="Sales per Drink">
                  <HorizontalBarChart
                    data={salesPerDrinkChartData}
                    labelKey="label"
                    detailKey="detail"
                    valueFormatter={formatCurrency}
                    limit={6}
                    accent
                  />
                </ChartCard>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-heading">
                <h2>Team Performance</h2>
              </div>
              <div className="dashboard-grid charts">
                <ChartCard title="Orders & Revenue per Employee">
                  <DualHorizontalBarChart
                    data={employeePerformanceData}
                    labelKey="label"
                    primaryKey="orders"
                    secondaryKey="revenue"
                    primaryLabel="Drinks Sold"
                    secondaryLabel="Revenue"
                  />
                </ChartCard>
                <div className="card table-card full-height">
                  <div className="card-title">Employee Roster</div>
                  <div className="table-scroll fill">
                    <table className="data-table compact">
                      <thead>
                        <tr><th>First</th><th>Last</th><th>Role</th></tr>
                      </thead>
                      <tbody>
                        {employees.length === 0 ? (
                          <tr><td colSpan="3" className="muted">No employees found</td></tr>
                        ) : employees.map((emp) => (
                          <tr key={emp.id}>
                            <td>{emp.first_name}</td>
                            <td>{emp.last_name}</td>
                            <td><span className="tag">{emp.role}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-heading">
                <h2>Inventory</h2>
              </div>
              <ChartCard title="Low Stock Inventory">
                <LowStockChart data={lowStockInventory} />
              </ChartCard>
            </div>

            <div className="dashboard-section">
              <div className="section-heading">
                <h2>Financial & POS Reports</h2>
              </div>
              <div className="dashboard-grid charts">
                <div className="card metric-card focal">
                  <div className="card-title">Highest Receipt Amount</div>
                  {dashboardLoading && !highestReceipt ? (
                    <div className="muted">Loading…</div>
                  ) : highestReceipt ? (
                    <div className="metric-body">
                      <div className="metric-value">{formatCurrency(highestReceipt.max_receipt)}</div>
                      <div className="muted small">Receipt #{highestReceipt.id}</div>
                      <div className="muted tiny">Employee #{highestReceipt.employee_id} on {highestReceiptDate}</div>
                    </div>
                  ) : (
                    <div className="muted">No receipts yet</div>
                  )}
                </div>
                <ReportCard
                  title="X-Report"
                  report={xReport}
                  loading={dashboardLoading}
                  onRun={() => handleRunReport('x')}
                  canRun={canRunReport('x')}
                  lastRunDate={reportRunState.x}
                />
                <ReportCard
                  title="Z-Report"
                  report={zReport}
                  loading={dashboardLoading}
                  onRun={() => handleRunReport('z')}
                  canRun={canRunReport('z')}
                  lastRunDate={reportRunState.z}
                />
              </div>
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
              {drinksLoading && <span className="muted">Loading…</span>}
              {menuError && <span className="error-text">{menuError}</span>}
            </div>
            <div className="manager-menu-grid">
              {drinks.map(d => (
                <button key={d.id} className="manager-menu-card" onClick={() => { setSelected(d); setMode('view'); }}>
                  <div className="manager-drink-art">
                    {d.drink_image_path ? (
                      <img src={d.drink_image_path} alt={d.drink_name} onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
                    ) : (
                      <div className="placeholder-circle large">{(d.drink_name || '?').slice(0,1)}</div>
                    )}
                  </div>
                  <div className="manager-drink-meta">
                    <div className="manager-drink-name">{d.drink_name}</div>
                    <div className="manager-drink-sub">{d.category}</div>
                    <div className="manager-drink-price">{formatCurrency(d.drink_price)}</div>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div className="manager-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                <div className="manager-modal">
                  <div className="manager-modal-header">
                    <div>
                      <div className="manager-modal-title">{mode === 'add' ? 'Add Drink' : mode === 'edit' ? 'Edit Drink' : 'Drink Details'}</div>
                      {mode === 'view' && <div className="manager-modal-subtitle">{selected.drink_name}</div>}
                    </div>
                    <div className="panel-actions">
                      {mode === 'view' && (
                        <>
                          <button onClick={() => setMode('edit')}>Edit Drink</button>
                          <button className="danger" onClick={() => { setDeleteError(''); setDeleteConfirmOpen(true); }}>Delete Drink</button>
                        </>
                      )}
                      <button onClick={closeModal}>Close</button>
                    </div>
                  </div>

                  <div className="manager-modal-body">
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
                          <button type="button" className="btn-save" onClick={async () => {
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
                          <button type="button" className="btn-cancel" onClick={() => setMode('view')}>Cancel</button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            )}

            {deleteConfirmOpen && (
              <div className="manager-confirm-overlay" onClick={(e) => { if (e.target === e.currentTarget && !deletePending) setDeleteConfirmOpen(false); }}>
                <div className="manager-confirm-card">
                  <div className="manager-confirm-title">Delete Drink</div>
                  <p className="manager-confirm-text">
                    Are you sure you want to delete <strong>{selected?.drink_name}</strong>? This action cannot be undone.
                  </p>
                  {deleteError && <div className="error-text small">{deleteError}</div>}
                  <div className="manager-confirm-actions">
                    <button className="btn-cancel" type="button" disabled={deletePending} onClick={() => setDeleteConfirmOpen(false)}>
                      Keep Drink
                    </button>
                    <button className="btn-delete" type="button" disabled={deletePending} onClick={handleDeleteDrink}>
                      {deletePending ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
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
