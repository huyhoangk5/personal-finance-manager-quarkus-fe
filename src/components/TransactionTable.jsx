import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, Search, PlusCircle, Filter, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';

const TransactionTable = ({ userId, onDataChange, onEdit, onAdd, refreshKey }) => {
  const toast = useToast();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions?userId=${userId}`);
      setTransactions(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách giao dịch:", err);
    }
  }, [userId]);

  const sortTransactions = (data, sortKey, direction) => {
    if (!data.length) return data;
    const sorted = [...data];
    sorted.sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'date') {
        aVal = a.date;
        bVal = b.date;
      } else if (sortKey === 'amount') {
        aVal = a.amount;
        bVal = b.amount;
      }
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...transactions];
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(t => t.note?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    if (startDate) {
      filtered = filtered.filter(t => t.date >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(t => t.date <= endDate);
    }
    const sorted = sortTransactions(filtered, sortConfig.key, sortConfig.direction);
    setFilteredTransactions(sorted);
  }, [transactions, searchTerm, filterType, startDate, endDate, sortConfig]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions, refreshKey]);

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      } else {
        return { key, direction: 'desc' };
      }
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown size={12} className="ms-1 text-muted" />;
    }
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ms-1" /> : <ArrowDown size={12} className="ms-1" />;
  };

  const confirmDelete = (id) => {
    setDeleteTarget({ id });
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/transactions/${deleteTarget.id}?userId=${userId}`);
      fetchTransactions();
      if (onDataChange) onDataChange();
      toast.showToast('success', 'Xóa giao dịch thành công', 'Đã xóa 1 giao dịch');
    } catch (err) {
      toast.showToast('error', 'Xóa giao dịch thất bại', err.response?.data || 'Đã xảy ra lỗi');
    } finally {
      setDeleteTarget(null);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setStartDate('');
    setEndDate('');
    setShowFilters(false);
  };

  return (
    <>
      <div className="card border-0 shadow-sm p-4 rounded-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <button onClick={onAdd} className="btn btn-primary d-flex align-items-center gap-2 rounded-3 px-3 shadow-sm">
            <PlusCircle size={20} /> Thêm giao dịch
          </button>
          <div className="d-flex gap-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Tìm theo ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && applyFiltersAndSort()}
            />
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} /> Lọc
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 p-3 border rounded bg-light">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">Loại giao dịch</label>
                <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="THU">Thu nhập</option>
                  <option value="CHI">Chi tiêu</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Từ ngày</label>
                <div className="input-group">
                  <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} id="filter-start-date" />
                </div>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Đến ngày</label>
                <div className="input-group">
                  <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} id="filter-end-date" />
                </div>
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button className="btn btn-secondary btn-sm w-100" onClick={resetFilters}>Xóa bộ lọc</button>
              </div>
            </div>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="small text-muted">
              <tr>
                <th className="cursor-pointer" onClick={() => handleSort('date')}>NGÀY {getSortIcon('date')}</th>
                <th>DANH MỤC</th>
                <th className="text-end cursor-pointer" onClick={() => handleSort('amount')}>SỐ TIỀN {getSortIcon('amount')}</th>
                <th>GHI CHÚ</th>
                <th className="text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.transactionId}>
                    <td className="small">{t.date}  </td>
                    <td>
                      <span className={`badge rounded-pill ${t.type === 'THU' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {t.category?.categoryName || "Chưa phân loại"}
                      </span>
                    </td>
                    <td className={`text-end fw-bold ${t.type === 'THU' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'THU' ? '+' : '-'}{(t.amount || 0).toLocaleString()}
                    </td>
                    <td className="text-dark small">{t.note || '-'}</td>
                    <td className="text-center">
                      <button onClick={() => onEdit(t)} className="btn btn-link text-primary p-1"><Edit size={16} /></button>
                      <button onClick={() => confirmDelete(t.transactionId)} className="btn btn-link text-danger p-1"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center py-4 text-muted">Không có giao dịch phù hợp</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        show={deleteTarget !== null}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa giao dịch này không?"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default TransactionTable;