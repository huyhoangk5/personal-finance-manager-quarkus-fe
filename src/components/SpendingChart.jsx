import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { useState, useEffect } from 'react';
import axios from 'axios';

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, Title,
  PointElement, LineElement, Filler
);

const SpendingChart = ({ userId }) => {
  const [pieData, setPieData] = useState(null);
  const [barData, setBarData] = useState(null);
  const [lineData, setLineData] = useState(null);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-bs-theme') || 'light');

  // Lắng nghe sự thay đổi theme
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.getAttribute('data-bs-theme') || 'light';
      setTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
    return () => observer.disconnect();
  }, []);

  const getThemeColors = () => {
    const isDark = theme === 'dark';
    return {
      textColor: isDark ? '#f1f5f9' : '#0f172a',
      gridColor: isDark ? '#1e293b' : '#e2e8f0',
      legendColor: isDark ? '#94a3b8' : '#64748b',
      tooltipBackground: isDark ? '#0f172a' : '#ffffff',
      tooltipTitleColor: isDark ? '#f1f5f9' : '#0f172a',
      tooltipBodyColor: isDark ? '#94a3b8' : '#64748b',
      axisColor: isDark ? '#94a3b8' : '#64748b'
    };
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // Pie
      const pieRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/spending-by-category-month?userId=${userId}&month=${currentMonth}`);
      const rawPie = pieRes.data;
      setPieData({
        labels: Object.keys(rawPie),
        datasets: [{
          data: Object.values(rawPie),
          backgroundColor: ['#0077b6', '#00b4d8', '#03045e', '#10b981', '#ef4444', '#f59e0b', '#64748b'],
          borderWidth: 2,
          borderColor: theme === 'dark' ? '#0f172a' : '#fff'
        }]
      });

      // Bar & Line
      const trendRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/trend?userId=${userId}&months=6`);
      const trend = trendRes.data;
      const months = trend.map(t => t.month);
      const incomes = trend.map(t => t.income);
      const expenses = trend.map(t => t.expense);
      setBarData({
        labels: months,
        datasets: [
          {
            label: 'Thu nhập',
            data: incomes,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderColor: '#10b981',
            borderWidth: 0,
            borderRadius: 6
          },
          {
            label: 'Chi tiêu',
            data: expenses,
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderColor: '#ef4444',
            borderWidth: 0,
            borderRadius: 6
          }
        ]
      });
      const balanceData = trend.map(t => t.income - t.expense);
      setLineData({
        labels: months,
        datasets: [{
          label: 'Số dư',
          data: balanceData,
          borderColor: '#0077b6',
          backgroundColor: 'rgba(0, 119, 182, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#0077b6',
          pointBorderColor: '#fff',
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      });

      // Top categories
      const topRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/top-spending-categories?userId=${userId}&limit=5`);
      setTopCategories(topRes.data);
    } catch (err) {
      console.error("Lỗi tải dữ liệu thống kê", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // Tạo options mới mỗi khi theme thay đổi
  const getChartOptions = () => {
    const colors = getThemeColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: { color: colors.legendColor, font: { size: 12, weight: '600' }, usePointStyle: true, padding: 20 }
        },
        tooltip: {
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.tooltipTitleColor,
          bodyColor: colors.tooltipBodyColor,
          borderColor: colors.gridColor,
          borderWidth: 1,
          padding: 12,
          boxPadding: 8
        }
      },
      scales: {
        y: {
          ticks: { color: colors.axisColor, font: { size: 11 }, callback: (val) => val.toLocaleString() },
          grid: { color: colors.gridColor, drawBorder: false }
        },
        x: {
          ticks: { color: colors.axisColor, font: { size: 11 } },
          grid: { display: false }
        }
      }
    };
  };

  const pieOptions = () => {
    const colors = getThemeColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: colors.legendColor, font: { size: 11, weight: '500' }, usePointStyle: true, padding: 15 }
        },
        tooltip: {
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.tooltipTitleColor,
          bodyColor: colors.tooltipBodyColor,
          padding: 12,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return ` ${label}: ${value.toLocaleString()}đ (${percentage}%)`;
            }
          }
    if (loading) return <div className="text-center p-5 text-muted">Đang phân tích dữ liệu tài chính...</div>;

  return (
    <div className="container py-2">
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="card border-0 bg-white p-4 h-100 shadow-sm">
            <h6 className="fw-bold mb-4 text-muted small text-uppercase letter-spacing">Cơ cấu chi tiêu tháng này</h6>
            <div style={{ height: '320px' }}>
              {pieData && <Pie key={theme} data={pieData} options={pieOptions()} />}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 bg-white p-4 h-100 shadow-sm">
            <h6 className="fw-bold mb-4 text-muted small text-uppercase letter-spacing">Top danh mục chi tiêu</h6>
            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <tbody>
                  {topCategories.map((item, idx) => (
                    <tr key={idx}>
                      <td className="ps-0">
                        <div className="d-flex align-items-center gap-2">
                          <div className="p-2 rounded-3" style={{ width: '8px', height: '32px', backgroundColor: ['#0077b6', '#00b4d8', '#03045e', '#10b981', '#ef4444'][idx % 5] }}></div>
                          <span className="fw-semibold">{item.category}</span>
                        </div>
                      </td>
                      <td className="text-end fw-bold">{(item.amount || 0).toLocaleString()} <small className="text-muted fw-normal">VND</small></td>
                    </tr>
                  ))}
                  {topCategories.length === 0 && (
                    <tr><td colSpan="2" className="text-center py-5 text-muted small">Chưa có dữ liệu giao dịch</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 bg-white p-4 mt-2 shadow-sm">
            <h6 className="fw-bold mb-4 text-muted small text-uppercase letter-spacing">So sánh Thu nhập & Chi tiêu</h6>
            <div style={{ height: '350px' }}>
              {barData && <Bar key={theme} data={barData} options={getChartOptions()} />}
            </div>
          </div>
        </div>

        <div className="col-12">
          <div className="card border-0 bg-white p-4 mt-2 shadow-sm">
            <h6 className="fw-bold mb-4 text-muted small text-uppercase letter-spacing">Xu hướng số dư tài khoản</h6>
            <div style={{ height: '350px' }}>
              {lineData && <Line key={theme} data={lineData} options={getChartOptions()} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingChart;