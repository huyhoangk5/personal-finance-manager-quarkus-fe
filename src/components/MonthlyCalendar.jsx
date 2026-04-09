import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const formatCompactNumber = (number) => {
  if (number === 0) return '';
  const abs = Math.abs(number);
  if (abs >= 1_000_000) {
    return (number / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'tr';
  }
  if (abs >= 1_000) {
    return (number / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return number.toString();
};

const MonthlyCalendar = ({ userId, month, onMonthChange, refreshKey }) => {
  const [dailyData, setDailyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoverDate, setHoverDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(month);

  useEffect(() => {
    setCurrentMonth(month);
  }, [month]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/daily-summary?userId=${userId}&month=${currentMonth}`);
        setDailyData(res.data);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu lịch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, currentMonth, refreshKey]); // thêm refreshKey vào dependency

  const changeMonth = (delta) => {
    const [year, mon] = currentMonth.split('-');
    let newYear = parseInt(year);
    let newMon = parseInt(mon) + delta;
    if (newMon < 1) {
      newMon = 12;
      newYear--;
    } else if (newMon > 12) {
      newMon = 1;
      newYear++;
    }
    const newMonth = `${newYear}-${String(newMon).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    if (onMonthChange) onMonthChange(newMonth);
  };

  if (loading) return <div className="text-center p-3">Đang tải...</div>;

  const [year, mon] = currentMonth.split('-');
  const firstDay = new Date(parseInt(year), parseInt(mon) - 1, 1).getDay();
  const daysInMonth = new Date(parseInt(year), parseInt(mon), 0).getDate();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentMonth}-${String(d).padStart(2, '0')}`;
    days.push({ day: d, date: dateStr, data: dailyData[dateStr] || { income: 0, expense: 0 } });
  }

  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className="card border-0 shadow-sm p-2 rounded-4 bg-white h-100">
      <div className="d-flex align-items-center justify-content-between mb-2 px-2">
        <div className="d-flex align-items-center gap-1">
          <Calendar size={18} className="text-primary" />
          <h6 className="fw-bold m-0">Thu - Chi</h6>
        </div>
        <div className="d-flex gap-1">
          <button className="btn btn-sm btn-outline-secondary p-1" onClick={() => changeMonth(-1)}>
            <ChevronLeft size={16} />
          </button>
          <span className="small fw-semibold mx-1">{currentMonth}</span>
          <button className="btn btn-sm btn-outline-secondary p-1" onClick={() => changeMonth(1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-borderless text-center align-middle mb-0" style={{ fontSize: '1.0rem' }}>
          <thead>
            <tr className="text-muted">
              {weekdays.map(day => <th key={day} className="py-1">{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIdx) => (
              <tr key={weekIdx}>
                {days.slice(weekIdx * 7, weekIdx * 7 + 7).map((day, idx) => (
                  <td key={idx} className="p-0" style={{ width: '14%' }}>
                    {day ? (
                      <div 
                        className="rounded p-1 position-relative"
                        onMouseEnter={() => setHoverDate(day.date)}
                        onMouseLeave={() => setHoverDate(null)}
                        style={{ cursor: 'default' }}
                      >
                        <div className="fw-bold" style={{ fontSize: '1.0rem' }}>{day.day}</div>
                        <div className="mt-1" style={{ fontSize: '0.9rem' }}>
                          {day.data.income > 0 && (
                            <div className="text-success fw-semibold">
                              +{formatCompactNumber(day.data.income)}
                            </div>
                          )}
                          {day.data.expense > 0 && (
                            <div className="text-danger fw-semibold">
                              -{formatCompactNumber(day.data.expense)}
                            </div>
                          )}
                          {day.data.income === 0 && day.data.expense === 0 && (
                            <div className="text-muted">-</div>
                          )}
                        </div>
                        {hoverDate === day.date && (day.data.income > 0 || day.data.expense > 0) && (
                          <div className="position-absolute top-100 start-50 translate-middle-x mt-1 bg-dark text-white rounded px-2 py-1 small z-3" style={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                            Thu: {day.data.income.toLocaleString()}đ<br/>
                            Chi: {day.data.expense.toLocaleString()}đ
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-muted p-1">-</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="d-flex justify-content-end gap-3 mt-2 px-2 small text-muted">
        <div><span className="text-success">●</span> Thu</div>
        <div><span className="text-danger">●</span> Chi</div>
      </div>
    </div>
  );
};

export default MonthlyCalendar;