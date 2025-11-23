import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/manager-panel.css';
import { managerAPI } from '../../services/api.js';
import LanguageDropdown from "../common/LanguageDropdown.jsx";
import TranslatedText from "../common/TranslateText.jsx";
import { useTranslation } from '../../context/translation-storage.jsx';
import homeIcon from '../../assets/home.png';

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

const getWeatherDescription = (code) => {
  // WMO Weather interpretation codes (WW)
  const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
  };
  return weatherCodes[code] || 'Unknown';
};


const ChartCard = ({ title, children, action, subtitle }) => (
  <div className="card chart-card">
    <div className="card-title-row">
      <div>
        <div className="card-title">
          <TranslatedText text={title} />
        </div>
        {subtitle && (
          <div className="card-subtitle">
            <TranslatedText text={subtitle} />
          </div>
        )}
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
  if (!data || data.length === 0) {
    return <div className="muted"><TranslatedText text="No data available" /></div>;
  }
  const trimmed = data.slice(-limit);
  const maxValue = Math.max(...trimmed.map((item) => Number(item[valueKey]) || 0)) || 1;

  return (
    <div className="bar-chart vertical">
      {trimmed.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const height = (value / maxValue) * 100;
        return (
          <div className="bar-col" key={`${item[labelKey]}-${item[valueKey]}-${item[detailKey] || ''}`}>
            <div
              className="bar"
              style={{ height: `${height || 0}%` }}
              aria-label={`${item[labelKey]} ${valueFormatter(value)}`}
            />
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
  if (!data || data.length === 0) {
    return <div className="muted"><TranslatedText text="No data available" /></div>;
  }
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
  if (!data || data.length === 0) {
    return <div className="muted"><TranslatedText text="No data available" /></div>;
  }
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
                <span className="muted tiny"><TranslatedText text={primaryLabel} /></span>
                <div className="row-bar subtle">
                  <div className="row-bar-fill" style={{ width: `${primaryWidth}%`, background: primaryColor }} />
                </div>
                <span className="row-value">{primaryFormatter(primary)}</span>
              </div>
              <div className="dual-bar">
                <span className="muted tiny"><TranslatedText text={secondaryLabel} /></span>
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
        <span>
          <span className="legend-dot" style={{ background: primaryColor }} />
          <TranslatedText text={primaryLabel} />
        </span>
        <span>
          <span className="legend-dot" style={{ background: secondaryColor }} />
          <TranslatedText text={secondaryLabel} />
        </span>
      </div>
    </div>
  );
};

const SparklineChart = ({ data = [], labelKey = 'label', valueKey = 'value' }) => {
  if (!data || data.length === 0) {
    return <div className="muted"><TranslatedText text="No data available" /></div>;
  }
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
  if (!data || data.length === 0) {
    return <div className="muted"><TranslatedText text="Stock levels look good." /></div>;
  }
  return (
    <div className="low-stock-chart">
      {data.map((item) => {
        const qty = Number(item.curramount) || 0;
        const width = Math.min((qty / LOW_STOCK_THRESHOLD) * 100, 100);
        return (
          <div className="low-stock-row" key={item.item}>
            <div className="low-stock-head">
              <span className="low-stock-item">{item.item}</span>
              <span className="low-stock-qty">
                {formatNumber(qty)}{' '}
                <TranslatedText text="left" />
              </span>
            </div>
            <div className="row-bar danger">
              <div className="row-bar-fill" style={{ width: `${width}%` }} />
            </div>
            <div className="low-stock-meta">
              {item.restockamount != null && (
                <span>
                  <TranslatedText text="Restock" />: {formatNumber(item.restockamount)}
                </span>
              )}
              {item.unitcost != null && (
                <span>
                  <TranslatedText text="Unit" />: {formatCurrency(item.unitcost)}
                </span>
              )}
              {item.vendor && (
                <span>
                  <TranslatedText text="Vendor" />: {item.vendor}
                </span>
              )}
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
        <div className="card-title">
          <TranslatedText text={title} />
        </div>
        <div className="card-subtitle">
          <TranslatedText text="Last run" />:{' '}
          {lastRunDate ? formatDate(lastRunDate) : <TranslatedText text="Never" />}
        </div>
      </div>
      {onRun && (
        <button className="pill-button small" onClick={onRun} disabled={!canRun}>
          {canRun ? <TranslatedText text="Run" /> : <TranslatedText text="Ran Today" />}
        </button>
      )}
    </div>
    {loading ? (
      <div className="muted"><TranslatedText text="Loading…" /></div>
    ) : report ? (
      <div className="report-body large">
        <div className="report-row">
          <span className="muted tiny"><TranslatedText text="Sales" /></span>
          <strong>{formatCurrency(report.total_sales)}</strong>
        </div>
        <div className="report-row">
          <span className="muted tiny"><TranslatedText text="Orders" /></span>
          <strong>{formatNumber(report.total_orders)}</strong>
        </div>
        <div className="report-row">
          <span className="muted tiny"><TranslatedText text="Avg Ticket" /></span>
          <strong>{formatCurrency(report.avg_order_value)}</strong>
        </div>
        <div className="report-meta-large">
          <div>
            <span className="muted tiny"><TranslatedText text="Report Date" /> </span>
            <strong>{formatDate(report.report_date)}</strong>
          </div>
          <div>
            <span className="muted tiny"><TranslatedText text="First Sale" /> </span>
            <strong>{report.first_transaction_time || '—'}</strong>
          </div>
          <div>
            <span className="muted tiny"><TranslatedText text="Last Sale" /> </span>
            <strong>{report.last_transaction_time || '—'}</strong>
          </div>
        </div>
        <div className="payment-breakdown">
          <div className="payment-heading">
            <TranslatedText text="Payment Mix" />
          </div>
          {Array.isArray(report.payment_breakdown) && report.payment_breakdown.length > 0 ? (
            report.payment_breakdown.map((p) => (
              <div className="payment-row bold" key={p.payment_method || 'Unknown'}>
                <span>{p.payment_method || <TranslatedText text="Unknown" />}</span>
                <span>
                  {formatNumber(p.total_orders)}{' '}
                  <TranslatedText text="orders" />
                </span>
                <strong>{formatCurrency(p.total_sales)}</strong>
              </div>
            ))
          ) : (
            <div className="muted tiny"><TranslatedText text="No payment data" /></div>
          )}
        </div>
      </div>
    ) : (
      <div className="muted"><TranslatedText text="No report yet" /></div>
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
  { id: 'Dashboard', label: 'Dashboard' },
  { id: 'OrderHistory', label: 'Order History' },
  { id: 'EmployeeManagement', label: 'Employee Management' },
  { id: 'Inventory', label: 'Inventory' },
  { id: 'MenuManagement', label: 'Menu Management' },
];

const ManagerPanel = () => {
  const navigate = useNavigate();
  const { translate } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  // Menu management + dashboard
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
  const [deleteEmployeeConfirmOpen, setDeleteEmployeeConfirmOpen] = useState(false);
  const [deleteEmployeePending, setDeleteEmployeePending] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // NEW: Order history
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [orderFilters, setOrderFilters] = useState({
    employeeId: '',
    dateFrom: '',
    dateTo: '',
  });

  // NEW: Employee management
  const [employeeList, setEmployeeList] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeesError, setEmployeesError] = useState('');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeMode, setEmployeeMode] = useState('view'); // 'view' | 'edit' | 'add'

  // NEW: Inventory management
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [inventoryMode, setInventoryMode] = useState('view'); // 'view' | 'edit' | 'add'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteItemConfirmOpen, setDeleteItemConfirmOpen] = useState(false);
  const [deleteItemPending, setDeleteItemPending] = useState(false);
  const [deleteItemError, setDeleteItemError] = useState('');

  // NEW: Drink ingredients management
  const [drinkIngredients, setDrinkIngredients] = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [newIngredient, setNewIngredient] = useState({ inventory_id: '', quantity_used: '' });

  const categories = useMemo(
    () => Array.from(new Set(drinks.map((d) => d.category))).sort(),
    [drinks],
  );
  const imagePaths = useMemo(
    () => Array.from(new Set(drinks.map((d) => d.drink_image_path))).sort(),
    [drinks],
  );

  const refreshDrinks = async () => {
    try {
      setDrinksLoading(true);
      setMenuError('');
      const res = await managerAPI.listDrinks();
      setDrinks(res.data || []);
    } catch (e) {
      console.error('Manager get drinks', e);
      setMenuError('Failed to load drinks'); // This will be translated when displayed
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
      setDashboardError('Failed to load dashboard'); // This will be translated when displayed
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // NEW: fetch helpers for manager views

  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError('');
      const res = await managerAPI.listOrders({
        employeeId: orderFilters.employeeId || undefined,
        dateFrom: orderFilters.dateFrom || undefined,
        dateTo: orderFilters.dateTo || undefined,
      });
      setOrders(res.data || []);
    } catch (e) {
      console.error('Manager list orders', e);
      setOrders([]);
      setOrdersError('Failed to load orders'); // This will be translated when displayed
    } finally {
      setOrdersLoading(false);
    }
  }, [orderFilters]);

  const fetchEmployees = useCallback(async () => {
    try {
      setEmployeesLoading(true);
      setEmployeesError('');
      const res = await managerAPI.listEmployees();
      setEmployeeList(res.data || []);
    } catch (e) {
      console.error('Manager list employees', e);
      setEmployeeList([]);
      setEmployeesError('Failed to load employees'); // This will be translated when displayed
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      setInventoryLoading(true);
      setInventoryError('');
      const res = await managerAPI.listInventory();
      setInventory(res.data || []);
    } catch (e) {
      console.error('Manager list inventory', e);
      setInventory([]);
      setInventoryError('Failed to load inventory'); // This will be translated when displayed
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  // Fetch ingredients for the selected drink
  const fetchDrinkIngredients = useCallback(async (drinkId) => {
    if (!drinkId) {
      setDrinkIngredients([]);
      return;
    }
    try {
      setIngredientsLoading(true);
      const res = await managerAPI.getDrinkIngredients(drinkId);
      setDrinkIngredients(res.data || []);
    } catch (e) {
      console.error('Manager get drink ingredients', e);
      setDrinkIngredients([]);
    } finally {
      setIngredientsLoading(false);
    }
  }, []);

  // persist report run state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('managerReportRunState', JSON.stringify(reportRunState));
    }
  }, [reportRunState]);

  // tab-specific loading
  useEffect(() => {
    if (activeTab === 'MenuManagement') {
      refreshDrinks();
      fetchInventory(); // Load inventory for ingredient dropdown
    }
  }, [activeTab, fetchInventory]);

  // Load ingredients when a drink is selected
  useEffect(() => {
    if (selected && selected.id) {
      fetchDrinkIngredients(selected.id);
    } else {
      setDrinkIngredients([]);
    }
  }, [selected, fetchDrinkIngredients]);

  // Fetch weather data
  useEffect(() => {
    const fetchWeather = async () => {
      setWeatherLoading(true);
      setWeatherError(null);
      
      try {
        // Get user's location
        const position = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false
          });
        });

        const { latitude, longitude } = position.coords;
        
        // Fetch weather from Open-Meteo (in Fahrenheit and mph)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        console.log('Weather data received:', data.current_weather, 'Units:', data.current_weather_units);
        setWeather(data.current_weather);
      } catch (error) {
        console.error('Error fetching weather:', error);
        setWeatherError(error.message);
        // Optionally use a default location (e.g., College Station, TX)
        try {
          const defaultLat = 30.6279;
          const defaultLon = -96.3344;
          const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${defaultLat}&longitude=${defaultLon}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph`
          );
          if (response.ok) {
            const data = await response.json();
            console.log('Fallback weather data received:', data.current_weather, 'Units:', data.current_weather_units);
            setWeather(data.current_weather);
            setWeatherError(null);
          }
        } catch (fallbackError) {
          console.error('Fallback weather fetch failed:', fallbackError);
        }
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, []);

  useEffect(() => {
    if (activeTab === 'Dashboard') {
      loadDashboard();
    }
  }, [activeTab, loadDashboard]);

  useEffect(() => {
    if (activeTab === 'OrderHistory') {
      fetchOrders();
    }
  }, [activeTab, fetchOrders]);

  useEffect(() => {
    if (activeTab === 'EmployeeManagement') {
      fetchEmployees();
    }
  }, [activeTab, fetchEmployees]);

  useEffect(() => {
    if (activeTab === 'Inventory') {
      fetchInventory();
    }
  }, [activeTab, fetchInventory]);

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

  // helpers for employee + inventory save

  const handleSaveEmployee = async () => {
    if (!editingEmployee) return;
    const payload = {
      first_name: editingEmployee.first_name || '',
      last_name: editingEmployee.last_name || '',
      role: editingEmployee.role || 'cashier',
      password: editingEmployee.password || '',
      phone_number: editingEmployee.phone_number || '',
    };

    if (employeeMode === 'add') {
      await managerAPI.addEmployee(payload);
    } else {
      await managerAPI.updateEmployee(editingEmployee.id, payload);
    }

    setEditingEmployee(null);
    setEmployeeMode('view');
    await fetchEmployees();
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    try {
      setDeleteEmployeePending(true);
      await managerAPI.deleteEmployee(employeeToDelete.id);
      setDeleteEmployeeConfirmOpen(false);
      setEmployeeToDelete(null);
      await fetchEmployees();
    } catch (error) {
      console.error('Failed to delete employee', error);
      alert(await translate('Failed to delete employee'));
    } finally {
      setDeleteEmployeePending(false);
    }
  };

  const handleSaveInventoryItem = async () => {
    if (!editingItem) return;
    try {
      setInventoryError('');
      const payload = {
        item: editingItem.item || '',
        curramount: Number(editingItem.curramount || 0),
        restockamount: editingItem.restockamount != null ? Number(editingItem.restockamount) : null,
        unitcost: editingItem.unitcost != null ? Number(editingItem.unitcost) : null,
        vendor: editingItem.vendor || '',
        serving: editingItem.serving != null ? Number(editingItem.serving) : null,
      };

      if (inventoryMode === 'add') {
        await managerAPI.addInventoryItem(payload);
      } else {
        await managerAPI.updateInventoryItem(editingItem.id, payload);
      }

      setEditingItem(null);
      setInventoryMode('view');
      await fetchInventory();
      } catch (error) {
        console.error('Failed to save inventory item', error);
        const errorMsg = error?.response?.data?.error || 'Failed to save inventory item';
        setInventoryError(errorMsg); // Will be translated when displayed via TranslatedText
      }
  };

  const handleDeleteInventoryItem = async () => {
    if (!itemToDelete) return;
    try {
      setDeleteItemPending(true);
      setDeleteItemError('');
      await managerAPI.deleteInventoryItem(itemToDelete.id);
      setDeleteItemConfirmOpen(false);
      setItemToDelete(null);
      await fetchInventory();
      } catch (error) {
        console.error('Failed to delete inventory item', error);
        const errorMsg = error?.response?.data?.error || 'Failed to delete inventory item';
        setDeleteItemError(errorMsg); // Will be translated when displayed via TranslatedText
      } finally {
      setDeleteItemPending(false);
    }
  };

  return (
    <div className="manager-container">
      <aside className={collapsed ? 'sidebar collapsed' : 'sidebar'}>
        <div className="sidebar-header">
          <div className="brand">
            <TranslatedText text="Manager" />
          </div>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>
        <nav className="menu">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={t.id === activeTab ? 'menu-item active' : 'menu-item'}
              onClick={() => setActiveTab(t.id)}
              title={t.label}
            >
              <span className="menu-text">
                <TranslatedText text={t.label} />
              </span>
            </button>
          ))}
        </nav>
        <div className="manager-language-dropdown">
          <LanguageDropdown />
        </div>
        <div className="manager-home-button">
          <div className="home-weather-row">
            <button
              className="home-button"
              onClick={() => navigate('/home')}
              title="Home"
            >
              <img 
                src={homeIcon} 
                alt="Home" 
                className="home-icon"
              />
            </button>
            {!collapsed && (
              <div className="weather-container">
                {weatherLoading ? (
                  <div className="weather-loading">
                    <TranslatedText text="Loading weather..." />
                  </div>
                ) : weatherError ? (
                  <div className="weather-error">
                    <TranslatedText text="Weather unavailable" />
                  </div>
                ) : weather ? (
                  <div className="weather-display">
                    <div className="weather-temp">
                      {Math.round(weather.temperature)}°F
                    </div>
                    <div className="weather-details">
                      <div className="weather-wind">
                        💨 {Math.round(weather.windspeed)} mph
                      </div>
                      <div className="weather-code">
                        <TranslatedText text={getWeatherDescription(weather.weathercode)} />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="content">
        {/* DASHBOARD TAB */}
        {activeTab === 'Dashboard' && (
          <section className="dashboard-view">
            <div className="section-header">
              <div>
                <h1><TranslatedText text="Dashboard" /></h1>
              </div>
              <button className="pill-button" onClick={loadDashboard} disabled={dashboardLoading}>
                {dashboardLoading
                  ? <TranslatedText text="Refreshing…" />
                  : <TranslatedText text="Refresh" />}
              </button>
            </div>
            {dashboardError && (
              <div className="alert error">
                <TranslatedText text={dashboardError} />
              </div>
            )}

            <div className="zoomViewport">
              <div className="zoomContainer">
            <div className="dashboard-section sales-tall">
              <div className="section-heading">
                <h2><TranslatedText text="Sales & Analytics" /></h2>
              </div>
              <div className="dashboard-grid charts">
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <ChartCard title="Weekly Sales Trend" subtitle="Orders per ISO week">
                    <VerticalBarChart
                      data={weeklyChartData}
                      labelKey="label"
                      valueKey="value"
                      detailKey="detail"
                      valueFormatter={formatNumber}
                    />
                  </ChartCard>
                </div>
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <ChartCard title="Hourly Orders" subtitle="Order count grouped by hour">
                  <SparklineChart data={hourlyOrdersData} labelKey="label" valueKey="value" />
                  <div className="chart-stats">
                    <div>
                      <span className="muted tiny"><TranslatedText text="Busiest Hour" /></span>
                      <strong>{topHour?.hour_of_day || '—'}</strong>
                    </div>
                    <div>
                      <span className="muted tiny"><TranslatedText text="Orders" /></span>
                      <strong>{topHour ? formatNumber(topHour.total_orders) : '—'}</strong>
                    </div>
                    <div>
                      <span className="muted tiny"><TranslatedText text="Revenue" /></span>
                      <strong>{topHour ? formatCurrency(topHour.total_sales) : '—'}</strong>
                    </div>
                  </div>
                </ChartCard>
                </div>

                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <ChartCard title="Peak Sales Day" subtitle="Top 10 orders summed per day">
                  {dashboardLoading && !peakDay ? (
                    <div className="muted"><TranslatedText text="Loading…" /></div>
                  ) : peakDay ? (
                    <div className="peak-card-body">
                      <div
                        className="radial-indicator"
                        style={{ backgroundImage: `conic-gradient(var(--brand) ${peakGauge}%, #f3f4f6 0)` }}
                      >
                        <div className="radial-inner">
                          <div className="radial-value">{formatCurrency(peakDay.sum)}</div>
                          <span className="muted tiny"><TranslatedText text="Top revenue" /></span>
                        </div>
                      </div>
                      <div className="peak-meta">
                        <div>
                          <span className="muted tiny"><TranslatedText text="Date" /> </span>
                          <strong>{peakDate}</strong>
                        </div>
                        <div>
                          <span className="muted tiny"><TranslatedText text="vs Highest Ticket" /></span>
                          <strong>{highestReceipt ? formatCurrency(highestReceipt.max_receipt) : '—'}</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="muted"><TranslatedText text="No peak day identified" /></div>
                  )}
                </ChartCard>
                </div>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-heading">
                <h2><TranslatedText text="Drink Performance" /></h2>
              </div>
              <div className="dashboard-grid charts">
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <ChartCard title="Drinks per Category">
                  <VerticalBarChart
                    data={drinkCountChartData}
                    labelKey="label"
                    valueKey="value"
                    valueFormatter={formatNumber}
                  />
                </ChartCard>
                </div>
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <ChartCard title="Orders per Category">
                  <VerticalBarChart
                    data={ordersPerCategoryData}
                    labelKey="label"
                    valueKey="value"
                    valueFormatter={formatNumber}
                  />
                </ChartCard>
                </div>
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
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
            </div>

            <div className="dashboard-section">
              <div className="section-heading">
                <h2><TranslatedText text="Team Performance" /></h2>
              </div>
              <div className="dashboard-grid charts">
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
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
                </div>
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <div className="card table-card full-height">
                  <div className="card-title">
                    <TranslatedText text="Employee Roster" />
                  </div>
                  <div className="table-scroll fill">
                    <table className="data-table compact">
                      <thead>
                        <tr>
                          <th><TranslatedText text="First" /></th>
                          <th><TranslatedText text="Last" /></th>
                          <th><TranslatedText text="Role" /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="muted">
                              <TranslatedText text="No employees found" />
                            </td>
                          </tr>
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
            </div>

            <div className="dashboard-section">
              <div className="section-heading">
                <h2><TranslatedText text="Inventory" /></h2>
              </div>
              <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                <ChartCard title="Low Stock Inventory">
                <LowStockChart data={lowStockInventory} />
              </ChartCard>
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-heading">
                <h2><TranslatedText text="Financial & POS Reports" /></h2>
              </div>
              <div className="dashboard-grid charts">
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <div className="card metric-card focal">
                  <div className="card-title">
                    <TranslatedText text="Highest Receipt Amount" />
                  </div>
                  {dashboardLoading && !highestReceipt ? (
                    <div className="muted"><TranslatedText text="Loading…" /></div>
                  ) : highestReceipt ? (
                    <div className="metric-body">
                      <div className="metric-value">{formatCurrency(highestReceipt.max_receipt)}</div>
                      <div className="muted small">
                        <TranslatedText text="Receipt #" />{highestReceipt.id}
                      </div>
                      <div className="muted tiny">
                        <TranslatedText text="Employee" /> #{highestReceipt.employee_id}{' '}
                        <TranslatedText text="on" /> {highestReceiptDate}
                      </div>
                    </div>
                  ) : (
                    <div className="muted"><TranslatedText text="No receipts yet" /></div>
                  )}
                </div>
                </div>
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
                  <ReportCard
                  title="X-Report"
                  report={xReport}
                  loading={dashboardLoading}
                  onRun={() => handleRunReport('x')}
                  canRun={canRunReport('x')}
                  lastRunDate={reportRunState.x}
                />
                </div>
                <div className="zoomTarget" data-closeclick="true" data-targetsize="0.7" data-duration="600">
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
            </div>
              </div>
            </div>
          </section>
        )}

        {/* ORDER HISTORY TAB */}
        {activeTab === 'OrderHistory' && (
          <section className="orders-view">
            <div className="section-header">
              <h1><TranslatedText text="Order History" /></h1>
              <button
                className="pill-button"
                onClick={fetchOrders}
                disabled={ordersLoading}
              >
                {ordersLoading
                  ? <TranslatedText text="Loading…" />
                  : <TranslatedText text="Refresh" />}
              </button>
            </div>

            {ordersError && (
              <div className="alert error">
                <TranslatedText text={ordersError} />
              </div>
            )}

            <div className="card filters-card">
              <div className="card-title-row">
                <div className="card-title">
                  <TranslatedText text="Filters" />
                </div>
              </div>
              <div className="filters-grid">
                <label className="filter-field">
                  <span><TranslatedText text="Employee ID" /></span>
                  <input
                    type="text"
                    value={orderFilters.employeeId}
                    onChange={(e) => setOrderFilters((prev) => ({ ...prev, employeeId: e.target.value }))}
                  />
                </label>
                <label className="filter-field">
                  <span><TranslatedText text="From Date" /></span>
                  <input
                    type="date"
                    value={orderFilters.dateFrom}
                    onChange={(e) => setOrderFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </label>
                <label className="filter-field">
                  <span><TranslatedText text="To Date" /></span>
                  <input
                    type="date"
                    value={orderFilters.dateTo}
                    onChange={(e) => setOrderFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                  />
                </label>
                <div className="filter-actions">
                  <button
                    type="button"
                    className="pill-button small"
                    onClick={fetchOrders}
                    disabled={ordersLoading}
                  >
                    <TranslatedText text="Apply Filters" />
                  </button>
                  <button
                    type="button"
                    className="pill-button subtle small"
                    onClick={() => setOrderFilters({ employeeId: '', dateFrom: '', dateTo: '' })}
                    disabled={ordersLoading}
                  >
                    <TranslatedText text="Clear" />
                  </button>
                </div>
              </div>
            </div>

            <div className="card table-card">
              <div className="card-title">
                <TranslatedText text="Orders" />
              </div>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th><TranslatedText text="Order #" /></th>
                      <th><TranslatedText text="Date" /></th>
                      <th><TranslatedText text="Employee" /></th>
                      <th><TranslatedText text="Total" /></th>
                      <th><TranslatedText text="Payment Method" /></th>
                      <th><TranslatedText text="Status" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <tr>
                        <td colSpan="6" className="muted">
                          <TranslatedText text="Loading orders…" />
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="muted">
                          <TranslatedText text="No orders found for this range." />
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const id = order.receipt_id ?? order.id;
                        const date = order.transaction_date ?? order.created_at;
                        const employeeName =
                          order.employee_name ||
                          (order.employee_first_name && order.employee_last_name
                            ? `${order.employee_first_name} ${order.employee_last_name}`
                            : order.employee_id);
                        const total = order.total ?? order.total_amount ?? order.receipt_total;
                        return (
                          <tr key={id}>
                            <td>{id}</td>
                            <td>{formatDate(date)}</td>
                            <td>{employeeName}</td>
                            <td>{formatCurrency(total)}</td>
                            <td>{order.payment_method || '—'}</td>
                            <td>{order.status || '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* EMPLOYEE MANAGEMENT TAB */}
        {activeTab === 'EmployeeManagement' && (
          <section className="employees-view">
            <div className="section-header">
              <h1><TranslatedText text="Employee Management" /></h1>
              <button
                className="pill-button"
                onClick={fetchEmployees}
                disabled={employeesLoading}
              >
                {employeesLoading
                  ? <TranslatedText text="Loading…" />
                  : <TranslatedText text="Refresh" />}
              </button>
            </div>

            {employeesError && (
              <div className="alert error">
                <TranslatedText text={employeesError} />
              </div>
            )}

            <div className="card table-card">
                <div className="card-title-row">
                  <div className="card-title">
                    <TranslatedText text="Employees" />
                  </div>
                  <button
                    type="button"
                    className="pill-button small"
                    onClick={() => {
                      setEditingEmployee({
                        first_name: '',
                        last_name: '',
                        password: '',
                        phone_number: '',
                        role: 'cashier',
                      });
                      setEmployeeMode('add');
                    }}
                  >
                    <TranslatedText text="+ Add Employee" />
                  </button>
                </div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th><TranslatedText text="ID" /></th>
                        <th><TranslatedText text="Password" /></th>
                        <th><TranslatedText text="First Name" /></th>
                        <th><TranslatedText text="Last Name" /></th>
                        <th><TranslatedText text="Role" /></th>
                        <th><TranslatedText text="Phone Number" /></th>
                        <th><TranslatedText text="Actions" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeesLoading ? (
                        <tr>
                          <td colSpan="7" className="muted">
                            <TranslatedText text="Loading employees…" />
                          </td>
                        </tr>
                      ) : employeeList.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="muted">
                            <TranslatedText text="No employees found" />
                          </td>
                        </tr>
                      ) : (
                        employeeList.map((emp) => {
                          const handleRowClick = () => {
                            setEditingEmployee({
                              id: emp.id,
                              first_name: emp.first_name,
                              last_name: emp.last_name,
                              role: emp.role,
                              password: emp.password || '',
                              phone_number: emp.phone_number || '',
                            });
                            setEmployeeMode('edit');
                          };
                          
                          return (
                            <tr
                              key={emp.id}
                              className="clickable-row"
                            >
                              <td onClick={handleRowClick}>{emp.id}</td>
                              <td onClick={handleRowClick}>{emp.password || '—'}</td>
                              <td onClick={handleRowClick}>{emp.first_name}</td>
                              <td onClick={handleRowClick}>{emp.last_name}</td>
                              <td onClick={handleRowClick}>{emp.role}</td>
                              <td onClick={handleRowClick}>{emp.phone_number || '—'}</td>
                              <td onClick={(e) => e.stopPropagation()}>
                                <button
                                  className="danger"
                                  style={{ padding: '4px 12px', fontSize: '14px' }}
                                  onClick={() => {
                                    setEmployeeToDelete(emp);
                                    setDeleteEmployeeConfirmOpen(true);
                                  }}
                                >
                                  <TranslatedText text="Delete" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            {editingEmployee && (
                <div
                  className="manager-modal-overlay"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setEditingEmployee(null);
                      setEmployeeMode('view');
                    }
                  }}
                >
                  <div className="manager-modal">
                    <div className="manager-modal-header">
                      <div>
                        <div className="manager-modal-title">
                          <TranslatedText
                            text={employeeMode === 'add' ? "Add Employee" : "Edit Employee"}
                          />
                        </div>
                      </div>
                      <div className="panel-actions">
                        <button onClick={() => {
                          setEditingEmployee(null);
                          setEmployeeMode('view');
                        }}>
                          <TranslatedText text="Close" />
                        </button>
                      </div>
                    </div>
                    <div className="manager-modal-body">
                      <form
                        className="form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveEmployee().catch((err) => {
                            console.error(err);
                          });
                        }}
                      >
                        {editingEmployee.id != null && (
                          <div className="form-row">
                            <label>
                              <TranslatedText text="ID" />
                            </label>
                            <input type="text" value={editingEmployee.id} disabled />
                          </div>
                        )}
                        <div className="form-row">
                          <label><TranslatedText text="First Name" /></label>
                          <input
                            type="text"
                            value={editingEmployee.first_name || ''}
                            onChange={(e) => setEditingEmployee((prev) => ({
                              ...prev,
                              first_name: e.target.value,
                            }))}
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Last Name" /></label>
                          <input
                            type="text"
                            value={editingEmployee.last_name || ''}
                            onChange={(e) => setEditingEmployee((prev) => ({
                              ...prev,
                              last_name: e.target.value,
                            }))}
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Password" /></label>
                          <input
                            type="text"
                            value={editingEmployee.password || ''}
                            onChange={(e) => setEditingEmployee((prev) => ({
                              ...prev,
                              password: e.target.value,
                            }))}
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Phone Number" /></label>
                          <input
                            type="text"
                            value={editingEmployee.phone_number || ''}
                            onChange={(e) => setEditingEmployee((prev) => ({
                              ...prev,
                              phone_number: e.target.value,
                            }))}
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Role" /></label>
                          <select
                            value={editingEmployee.role || 'cashier'}
                            onChange={(e) => setEditingEmployee((prev) => ({
                              ...prev,
                              role: e.target.value,
                            }))}
                          >
                            <option value="cashier"><TranslatedText text="Cashier" /></option>
                            <option value="manager"><TranslatedText text="Manager" /></option>
                            <option value="Staff Member"><TranslatedText text="Staff Member" /></option>
                          </select>
                        </div>
                        <div className="form-actions">
                          <button
                            type="submit"
                            className="btn-save"
                            disabled={employeesLoading}
                          >
                            <TranslatedText text="Save" />
                          </button>
                          <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => {
                              setEditingEmployee(null);
                              setEmployeeMode('view');
                            }}
                          >
                            <TranslatedText text="Cancel" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {deleteEmployeeConfirmOpen && (
                <div
                  className="manager-confirm-overlay"
                  onClick={(e) => {
                    if (e.target === e.currentTarget && !deleteEmployeePending) {
                      setDeleteEmployeeConfirmOpen(false);
                      setEmployeeToDelete(null);
                    }
                  }}
                >
                  <div className="manager-confirm-card">
                    <div className="manager-confirm-title">
                      <TranslatedText text="Delete Employee" />
                    </div>
                    <div className="manager-confirm-text">
                      <TranslatedText text={`Are you sure you want to delete ${employeeToDelete?.first_name} ${employeeToDelete?.last_name}? This action cannot be undone.`} />
                    </div>
                    {deleteError && (
                      <div className="alert error">
                        <TranslatedText text={deleteError} />
                      </div>
                    )}
                    <div className="manager-confirm-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setDeleteEmployeeConfirmOpen(false);
                          setEmployeeToDelete(null);
                        }}
                        disabled={deleteEmployeePending}
                      >
                        <TranslatedText text="Cancel" />
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={handleDeleteEmployee}
                        disabled={deleteEmployeePending}
                      >
                        {deleteEmployeePending ? (
                          <TranslatedText text="Deleting…" />
                        ) : (
                          <TranslatedText text="Delete" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </section>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'Inventory' && (
          <section className="inventory-view">
            <div className="section-header">
              <h1><TranslatedText text="Inventory" /></h1>
              <button
                className="pill-button"
                onClick={fetchInventory}
                disabled={inventoryLoading}
              >
                {inventoryLoading
                  ? <TranslatedText text="Loading…" />
                  : <TranslatedText text="Refresh" />}
              </button>
            </div>

            {inventoryError && (
              <div className="alert error">
                <TranslatedText text={inventoryError} />
              </div>
            )}

            <div className="card table-card">
                <div className="card-title-row">
                  <div className="card-title">
                    <TranslatedText text="Stock Items" />
                  </div>
                  <button
                    type="button"
                    className="pill-button small"
                    onClick={() => {
                      setEditingItem({
                        item: '',
                        curramount: 0,
                        restockamount: null,
                        unitcost: null,
                        vendor: '',
                        serving: null,
                      });
                      setInventoryMode('add');
                      setInventoryError('');
                    }}
                  >
                    <TranslatedText text="+ Add Item" />
                  </button>
                </div>
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th><TranslatedText text="Item" /></th>
                        <th><TranslatedText text="Vendor" /></th>
                        <th><TranslatedText text="On Hand" /></th>
                        <th><TranslatedText text="Restock" /></th>
                        <th><TranslatedText text="Unit Cost" /></th>
                        <th><TranslatedText text="Serving" /></th>
                        <th><TranslatedText text="Actions" /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLoading ? (
                        <tr>
                          <td colSpan="7" className="muted">
                            <TranslatedText text="Loading inventory…" />
                          </td>
                        </tr>
                      ) : inventory.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="muted">
                            <TranslatedText text="No inventory items found" />
                          </td>
                        </tr>
                      ) : (
                        inventory.map((item) => {
                          const isLowStock = item.lowstock === true || item.lowstock === 't' || (item.curramount != null && Number(item.curramount) < 30);
                          const handleEditClick = () => {
                            setEditingItem({
                              id: item.id,
                              item: item.item,
                              curramount: item.curramount,
                              restockamount: item.restockamount,
                              unitcost: item.unitcost,
                              vendor: item.vendor || '',
                              serving: item.serving,
                            });
                            setInventoryMode('edit');
                          };
                          
                          return (
                            <tr
                              key={item.id}
                              className={isLowStock ? 'low-stock-row' : ''}
                            >
                              <td 
                                style={{ fontWeight: isLowStock ? '600' : 'normal', color: isLowStock ? '#ca8a04' : 'inherit' }}
                              >
                                {item.item}
                              </td>
                              <td>{item.vendor || '—'}</td>
                              <td 
                                style={{ fontWeight: isLowStock ? '600' : 'normal', color: isLowStock ? '#ca8a04' : 'inherit' }}
                              >
                                {formatNumber(item.curramount)}
                              </td>
                              <td>{item.restockamount != null ? formatNumber(item.restockamount) : '—'}</td>
                              <td>{item.unitcost != null ? formatCurrency(item.unitcost) : '—'}</td>
                              <td>{item.serving != null ? formatNumber(item.serving) : '—'}</td>
                              <td>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button
                                    className="restock-button"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!item.restockamount || item.restockamount <= 0) return;
                                      try {
                                        await managerAPI.restockInventoryItem(item.id);
                                        await fetchInventory();
                                      } catch (error) {
                                        console.error('Failed to restock item', error);
                                        alert(await translate('Failed to restock item'));
                                      }
                                    }}
                                    disabled={!item.restockamount || item.restockamount <= 0}
                                  >
                                    <TranslatedText text="Restock" />
                                  </button>
                                  <button
                                    className="pill-button small"
                                    onClick={handleEditClick}
                                    style={{ padding: '4px 12px', fontSize: '14px' }}
                                  >
                                    <TranslatedText text="Edit" />
                                  </button>
                                  <button
                                    className="danger"
                                    style={{ padding: '4px 12px', fontSize: '14px' }}
                                    onClick={() => {
                                      setItemToDelete(item);
                                      setDeleteItemConfirmOpen(true);
                                    }}
                                  >
                                    <TranslatedText text="Delete" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {editingItem && (
                <div
                  className="manager-modal-overlay"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) {
                      setEditingItem(null);
                      setInventoryMode('view');
                    }
                  }}
                >
                  <div className="manager-modal">
                    <div className="manager-modal-header">
                      <div>
                        <div className="manager-modal-title">
                          <TranslatedText
                            text={inventoryMode === 'add' ? "Add Inventory Item" : "Edit Inventory Item"}
                          />
                        </div>
                      </div>
                      <div className="panel-actions">
                        <button onClick={() => {
                          setEditingItem(null);
                          setInventoryMode('view');
                        }}>
                          <TranslatedText text="Close" />
                        </button>
                      </div>
                    </div>
                    <div className="manager-modal-body">
                      {inventoryError && (
                        <div className="alert error" style={{ marginBottom: '16px' }}>
                          <TranslatedText text={inventoryError} />
                        </div>
                      )}
                      <form
                        className="form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveInventoryItem().catch((err) => console.error(err));
                        }}
                      >
                        {editingItem.id != null && (
                          <div className="form-row">
                            <label><TranslatedText text="ID" /></label>
                            <input type="text" value={editingItem.id} disabled />
                          </div>
                        )}
                        <div className="form-row">
                          <label><TranslatedText text="Item Name" /></label>
                          <input
                            type="text"
                            value={editingItem.item || ''}
                            onChange={(e) => setEditingItem((prev) => ({
                              ...prev,
                              item: e.target.value,
                            }))}
                            required
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="On Hand Quantity" /></label>
                          <input
                            type="number"
                            value={editingItem.curramount || ''}
                            onChange={(e) => setEditingItem((prev) => ({
                              ...prev,
                              curramount: e.target.value,
                            }))}
                            min="0"
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Restock Target" /></label>
                          <input
                            type="number"
                            value={editingItem.restockamount ?? ''}
                            onChange={(e) => setEditingItem((prev) => ({
                              ...prev,
                              restockamount: e.target.value === '' ? null : Number(e.target.value),
                            }))}
                            min="0"
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Unit Cost" /></label>
                          <input
                            type="number"
                            step="0.01"
                            value={editingItem.unitcost ?? ''}
                            onChange={(e) => setEditingItem((prev) => ({
                              ...prev,
                              unitcost: e.target.value === '' ? null : Number(e.target.value),
                            }))}
                            min="0"
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Vendor" /></label>
                          <input
                            type="text"
                            value={editingItem.vendor || ''}
                            onChange={(e) => setEditingItem((prev) => ({
                              ...prev,
                              vendor: e.target.value,
                            }))}
                          />
                        </div>
                        <div className="form-row">
                          <label><TranslatedText text="Serving" /></label>
                          <input
                            type="number"
                            value={editingItem.serving ?? ''}
                            onChange={(e) => setEditingItem((prev) => ({
                              ...prev,
                              serving: e.target.value === '' ? null : Number(e.target.value),
                            }))}
                            min="0"
                          />
                        </div>
                        <div className="form-actions">
                          <button
                            type="submit"
                            className="btn-save"
                            disabled={inventoryLoading}
                          >
                            <TranslatedText text="Save" />
                          </button>
                          <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => {
                              setEditingItem(null);
                              setInventoryMode('view');
                              setInventoryError('');
                            }}
                          >
                            <TranslatedText text="Cancel" />
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {deleteItemConfirmOpen && (
                <div
                  className="manager-confirm-overlay"
                  onClick={(e) => {
                    if (e.target === e.currentTarget && !deleteItemPending) {
                      setDeleteItemConfirmOpen(false);
                      setItemToDelete(null);
                    }
                  }}
                >
                  <div className="manager-confirm-card">
                    <div className="manager-confirm-title">
                      <TranslatedText text="Delete Inventory Item" />
                    </div>
                    <div className="manager-confirm-text">
                      <TranslatedText text={`Are you sure you want to delete "${itemToDelete?.item}"? This action cannot be undone.`} />
                    </div>
                    {deleteItemError && (
                      <div className="alert error">
                        <TranslatedText text={deleteItemError} />
                      </div>
                    )}
                    <div className="manager-confirm-actions">
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() => {
                          setDeleteItemConfirmOpen(false);
                          setItemToDelete(null);
                          setDeleteItemError('');
                        }}
                        disabled={deleteItemPending}
                      >
                        <TranslatedText text="Cancel" />
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={handleDeleteInventoryItem}
                        disabled={deleteItemPending}
                      >
                        {deleteItemPending ? (
                          <TranslatedText text="Deleting…" />
                        ) : (
                          <TranslatedText text="Delete" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
          </section>
        )}

        {/* MENU MANAGEMENT TAB (existing, mostly unchanged except some text wrapped) */}
        {activeTab === 'MenuManagement' && (
          <section>
            <h1><TranslatedText text="Menu Management" /></h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <button
                className="menu-action"
                onClick={() => {
                  setSelected({
                    category: categories[0] || '',
                    drink_name: '',
                    drink_price: '',
                    drink_image_path: imagePaths[0] || '',
                  });
                  setMode('add');
                }}
              >
                <TranslatedText text="+ Add Drink" />
              </button>
              {drinksLoading && (
                <span className="muted">
                  <TranslatedText text="Loading…" />
                </span>
              )}
              {menuError && (
                <span className="error-text">
                  <TranslatedText text={menuError} />
                </span>
              )}
            </div>
            <div className="manager-menu-grid">
              {drinks.map((d) => (
                <button
                  key={d.id}
                  className="manager-menu-card"
                  onClick={() => {
                    setSelected(d);
                    setMode('view');
                  }}
                >
                  <div className="manager-drink-art">
                    {d.drink_image_path ? (
                      <img
                        src={d.drink_image_path}
                        alt={d.drink_name}
                        onError={(e) => {
                          e.currentTarget.style.visibility = 'hidden';
                        }}
                      />
                    ) : (
                      <div className="placeholder-circle large">
                        {(d.drink_name || '?').slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="manager-drink-meta">
                    <div className="manager-drink-name">{d.drink_name}</div>
                    <div className="manager-drink-sub">{d.category}</div>
                    <div className="manager-drink-price">
                      {formatCurrency(d.drink_price)}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {selected && (
              <div
                className="manager-modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) closeModal();
                }}
              >
                <div className="manager-modal">
                  <div className="manager-modal-header">
                    <div>
                      <div className="manager-modal-title">
                        <TranslatedText
                          text={
                            mode === 'add'
                              ? "Add Drink"
                              : mode === 'edit'
                                ? "Edit Drink"
                                : "Drink Details"
                          }
                        />
                      </div>
                      {mode === 'view' && (
                        <div className="manager-modal-subtitle">
                          {selected.drink_name}
                        </div>
                      )}
                    </div>
                    <div className="panel-actions">
                      {mode === 'view' && (
                        <>
                          <button onClick={() => setMode('edit')}>
                            <TranslatedText text="Edit Drink" />
                          </button>
                          <button
                            className="danger"
                            onClick={() => {
                              setDeleteError('');
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <TranslatedText text="Delete Drink" />
                          </button>
                        </>
                      )}
                      <button onClick={closeModal}>
                        <TranslatedText text="Close" />
                      </button>
                    </div>
                  </div>

                  <div className="manager-modal-body">
                    <form
                      onSubmit={(e) => e.preventDefault()}
                      className="form"
                    >
                      <div className="form-row">
                        <label><TranslatedText text="ID" /></label>
                        <input type="text" value={selected.id ?? 'Auto'} disabled />
                      </div>
                      <div className="form-row">
                        <label><TranslatedText text="Category" /></label>
                        <select
                          value={selected.category || ''}
                          disabled={mode === 'view'}
                          onChange={(e) =>
                            setSelected({ ...selected, category: e.target.value })
                          }
                        >
                          <option value="" disabled>
                            <TranslatedText text="Select a category" />
                          </option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-row">
                        <label><TranslatedText text="Drink Name" /></label>
                        <input
                          type="text"
                          value={selected.drink_name || ''}
                          disabled={mode === 'view'}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              drink_name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-row">
                        <label><TranslatedText text="Drink Price" /></label>
                        <input
                          type="number"
                          step="0.01"
                          value={selected.drink_price || ''}
                          disabled={mode === 'view'}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              drink_price: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="form-row">
                        <label><TranslatedText text="Image Path" /></label>
                        <select
                          value={selected.drink_image_path || ''}
                          disabled={mode === 'view'}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              drink_image_path: e.target.value,
                            })
                          }
                        >
                          <option value="" disabled>
                            <TranslatedText text="Select an image" />
                          </option>
                          {imagePaths.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-row">
                        <label><TranslatedText text="Seasonal" /></label>
                        <input
                          type="text"
                          value={selected.is_seasonal ? 'true' : 'false'}
                          disabled
                        />
                      </div>

                      {/* Ingredients Section - Only show if drink has been saved (has an ID) */}
                      {selected.id && (
                        <div className="form-section" style={{ 
                          gridColumn: '1 / -1', 
                          marginTop: '24px', 
                          paddingTop: '24px', 
                          borderTop: '1px solid #e0e0e0' 
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <label style={{ fontSize: '16px', fontWeight: '600' }}>
                              <TranslatedText text="Ingredients" />
                            </label>
                            {ingredientsLoading && (
                              <span className="muted">
                                <TranslatedText text="Loading…" />
                              </span>
                            )}
                          </div>

                        {/* Ingredients List */}
                        {drinkIngredients.length > 0 ? (
                          <div style={{ marginBottom: '16px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>
                                    <TranslatedText text="Ingredient" />
                                  </th>
                                  <th style={{ textAlign: 'left', padding: '8px', fontWeight: '600' }}>
                                    <TranslatedText text="Quantity Used" />
                                  </th>
                                  {mode !== 'view' && (
                                    <th style={{ textAlign: 'right', padding: '8px', fontWeight: '600' }}>
                                      <TranslatedText text="Actions" />
                                    </th>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {drinkIngredients.map((ing) => (
                                  <tr key={ing.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                    <td style={{ padding: '8px' }}>{ing.inventory_item}</td>
                                    <td style={{ padding: '8px' }}>
                                      {mode === 'view' ? (
                                        ing.quantity_used
                                      ) : (
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          defaultValue={ing.quantity_used || ''}
                                          onBlur={async (e) => {
                                            const newValue = parseFloat(e.target.value);
                                            if (!isNaN(newValue) && newValue >= 0 && newValue !== ing.quantity_used) {
                                              try {
                                                await managerAPI.updateDrinkIngredient(ing.id, {
                                                  quantity_used: newValue
                                                });
                                                // Refresh ingredients list
                                                await fetchDrinkIngredients(selected.id);
                                              } catch (error) {
                                                console.error('Failed to update ingredient', error);
                                                alert(await translate('Failed to update ingredient quantity'));
                                              }
                                            }
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.target.blur();
                                            }
                                          }}
                                          style={{ width: '100px', padding: '4px' }}
                                        />
                                      )}
                                    </td>
                                    {mode !== 'view' && (
                                      <td style={{ padding: '8px', textAlign: 'right' }}>
                                        <button
                                          type="button"
                                          className="danger"
                                          style={{ padding: '4px 12px', fontSize: '14px' }}
                                          onClick={async () => {
                                            if (window.confirm('Are you sure you want to remove this ingredient?')) {
                                              try {
                                                await managerAPI.deleteDrinkIngredient(ing.id);
                                                await fetchDrinkIngredients(selected.id);
                                              } catch (error) {
                                                console.error('Failed to delete ingredient', error);
                                              }
                                            }
                                          }}
                                        >
                                          <TranslatedText text="Delete" />
                                        </button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ marginBottom: '16px', color: '#666', fontStyle: 'italic' }}>
                            <TranslatedText text="No ingredients added yet" />
                          </div>
                        )}

                        {/* Add New Ingredient (only in edit/add mode) */}
                        {mode !== 'view' && selected.id && (
                          <div style={{ 
                            padding: '16px', 
                            backgroundColor: '#f9f9f9', 
                            borderRadius: '4px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-end'
                          }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                <TranslatedText text="Add Ingredient" />
                              </label>
                              <select
                                value={newIngredient.inventory_id || ''}
                                onChange={(e) => setNewIngredient({ ...newIngredient, inventory_id: e.target.value })}
                                style={{ width: '100%', padding: '8px' }}
                              >
                                <option value="" disabled>
                                  <TranslatedText text="Select an ingredient" />
                                </option>
                                {inventory && inventory.length > 0 ? (
                                  inventory
                                    .filter(inv => {
                                      // Filter out ingredients that are already added
                                      // Compare as numbers to avoid type mismatch
                                      const invId = parseInt(inv.id, 10);
                                      return !drinkIngredients.some(di => parseInt(di.inventory_id, 10) === invId);
                                    })
                                    .map((inv) => (
                                      <option key={inv.id} value={inv.id}>
                                        {inv.item}
                                      </option>
                                    ))
                                ) : (
                                  <option value="" disabled>
                                    {inventoryLoading ? (
                                      <TranslatedText text="Loading inventory..." />
                                    ) : (
                                      <TranslatedText text="No inventory items available" />
                                    )}
                                  </option>
                                )}
                              </select>
                            </div>
                            <div style={{ width: '150px' }}>
                              <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                                <TranslatedText text="Quantity" />
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newIngredient.quantity_used || ''}
                                onChange={(e) => setNewIngredient({ ...newIngredient, quantity_used: e.target.value })}
                                placeholder="0.00" // Numeric placeholder, no translation needed
                                style={{ width: '100%', padding: '8px' }}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn-save"
                              style={{ padding: '8px 16px' }}
                              disabled={!newIngredient.inventory_id || !newIngredient.quantity_used}
                              onClick={async () => {
                                try {
                                  console.log('Adding ingredient with data:', {
                                    drinkId: selected.id,
                                    inventory_id: newIngredient.inventory_id,
                                    quantity_used: newIngredient.quantity_used
                                  });
                                  
                                  const response = await managerAPI.addDrinkIngredient(selected.id, {
                                    inventory_id: parseInt(newIngredient.inventory_id, 10),
                                    quantity_used: parseFloat(newIngredient.quantity_used)
                                  });
                                  
                                  console.log('Ingredient added successfully:', response.data);
                                  setNewIngredient({ inventory_id: '', quantity_used: '' });
                                  await fetchDrinkIngredients(selected.id);
                                } catch (error) {
                                  console.error('Failed to add ingredient - full error:', error);
                                  console.error('Error response:', error.response?.data);
                                  const errorMsg = error.response?.data?.error || error.message || 'Failed to add ingredient';
                                  alert(await translate(`Failed to add ingredient: ${errorMsg}`));
                                }
                              }}
                            >
                              <TranslatedText text="Add" />
                            </button>
                          </div>
                        )}
                        </div>
                      )}

                      {!selected.id && mode === 'add' && (
                        <div style={{ marginTop: '24px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '4px', fontSize: '14px', color: '#666' }}>
                          <TranslatedText text="Save the drink first to add ingredients" />
                        </div>
                      )}

                      {mode !== 'view' && (
                        <div className="form-actions">
                          <button
                            type="button"
                            className="btn-save"
                            onClick={async () => {
                              if (mode === 'edit') {
                                const payload = {
                                  category: selected.category,
                                  drink_name: selected.drink_name,
                                  drink_price: Number(selected.drink_price),
                                  drink_image_path: selected.drink_image_path,
                                };
                                const updated = await managerAPI.updateDrink(
                                  selected.id,
                                  payload,
                                );
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
                            }}
                          >
                            <TranslatedText text="Save" />
                          </button>
                          <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setMode('view')}
                          >
                            <TranslatedText text="Cancel" />
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            )}

            {deleteConfirmOpen && (
              <div
                className="manager-confirm-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget && !deletePending) {
                    setDeleteConfirmOpen(false);
                  }
                }}
              >
                <div className="manager-confirm-card">
                  <div className="manager-confirm-title">
                    <TranslatedText text="Delete Drink" />
                  </div>
                  <p className="manager-confirm-text">
                    <TranslatedText text="Are you sure you want to delete" />{' '}
                    <strong>{selected?.drink_name}</strong>?
                    {' '}
                    <TranslatedText text="This action cannot be undone." />
                  </p>
                  {deleteError && (
                    <div className="error-text small">
                      <TranslatedText text={deleteError} />
                    </div>
                  )}
                  <div className="manager-confirm-actions">
                    <button
                      className="btn-cancel"
                      type="button"
                      disabled={deletePending}
                      onClick={() => setDeleteConfirmOpen(false)}
                    >
                      <TranslatedText text="Keep Drink" />
                    </button>
                    <button
                      className="btn-delete"
                      type="button"
                      disabled={deletePending}
                      onClick={handleDeleteDrink}
                    >
                      <TranslatedText text={deletePending ? "Deleting…" : "Delete"} />
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
