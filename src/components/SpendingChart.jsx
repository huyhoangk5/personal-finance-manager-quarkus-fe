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
      textColor: isDark ? '#f8f9fa' : '#212529',
      gridColor: isDark ? '#4a4a4a' : '#e0e0e0',
      legendColor: isDark ? '#e9ecef' : '#333',
      tooltipBackground: isDark ? '#2c2c2c' : '#ffffff',
      tooltipTitleColor: isDark ? '#f8f9fa' : '#212529',
      tooltipBodyColor: isDark ? '#adb5bd' : '#555',
      axisColor: isDark ? '#adb5bd' : '#555'
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
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF'],
          borderWidth: 1,
          borderColor: '#fff'
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
            backgroundColor: 'rgba(40, 167, 69, 0.7)',
            borderColor: 'rgb(40, 167, 69)',
            borderWidth: 2,
            borderRadius: 4
          },
          {
            label: 'Chi tiêu',
            data: expenses,
            backgroundColor: 'rgba(220, 53, 69, 0.7)',
            borderColor: 'rgb(220, 53, 69)',
            borderWidth: 2,
            borderRadius: 4
          }
        ]
      });
      const balanceData = trend.map(t => t.income - t.expense);
      setLineData({
        labels: months,
        datasets: [{
          label: 'Số dư',
          data: balanceData,
          borderColor: 'rgb(0, 123, 255)',
          backgroundColor: 'rgba(0, 123, 255, 0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(0, 123, 255)',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
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
          labels: { color: colors.legendColor, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.tooltipTitleColor,
          bodyColor: colors.tooltipBodyColor,
          borderColor: colors.gridColor,
          borderWidth: 1
        }
      },
      scales: {
        y: {
          ticks: { color: colors.axisColor, stepSize: 1000000, callback: (val) => val.toLocaleString() },
          grid: { color: colors.gridColor }
        },
        x: {
          ticks: { color: colors.axisColor },
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
          labels: { color: colors.legendColor, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.tooltipTitleColor,
          bodyColor: colors.tooltipBodyColor,
          callbacks: {
            label: (context) => {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${label}: ${value.toLocaleString()}đ (${percentage}%)`;
            }
          }
        }
      }
    };
  };

  if (loading) return <div className="text-center p-5">Đang tải dữ liệu thống kê...</div>;

  return (
    <div className="container mt-4">
      <div className="row g-4">
        <div className="col-md-6">
          <div className="card shadow p-3 h-100">
            <h5 className="text-center mb-3">Cơ cấu chi tiêu trong tháng</h5>
            <div style={{ maxHeight: '300px' }} className="d-flex justify-content-center">
              {pieData && <Pie key={theme} data={pieData} options={pieOptions()} />}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow p-3 h-100">
            <h5 className="text-center mb-3">Top danh mục chi tiêu trong tháng</h5>
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Danh mục</th>
                    <th className="text-end">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {topCategories.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.category}</td>
                      <td className="text-end fw-bold">{(item.amount || 0).toLocaleString()}đ</td>
                    </tr>
                  ))}
                  {topCategories.length === 0 && (
                    <tr><td colSpan="2" className="text-center text-muted">Chưa có dữ liệu chi tiêu tháng này</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-12">
          <div className="card shadow p-3">
            <h5 className="text-center mb-3">Thu nhập & Chi tiêu theo tháng</h5>
            <div style={{ height: '400px' }}>
              {barData && <Bar key={theme} data={barData} options={getChartOptions()} />}
            </div>
          </div>
        </div>

        <div className="col-md-12">
          <div className="card shadow p-3">
            <h5 className="text-center mb-3">Xu hướng số dư</h5>
            <div style={{ height: '400px' }}>
              {lineData && <Line key={theme} data={lineData} options={getChartOptions()} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingChart;