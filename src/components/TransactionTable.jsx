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
  const [selectedRows, setSelectedRows] = useState(new Set()); // Lưu id các dòng được chọn
  const [isDeletingMultiple, setIsDeletingMultiple] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/transactions?userId=${userId}`);
      setTransactions(res.data);
      setSelectedRows(new Set()); // Reset selection khi refresh
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

  // Xử lý checkbox
  const toggleSelectRow = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredTransactions.length) {
      setSelectedRows(new Set());
    } else {
      const allIds = filteredTransactions.map(t => t.transactionId);
      setSelectedRows(new Set(allIds));
    }
  };

  const deleteSelected = async () => {
    if (selectedRows.size === 0) {
      toast.showToast('warning', 'Chưa chọn', 'Vui lòng chọn giao dịch cần xóa');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedRows.size} giao dịch đã chọn?`)) {
      setIsDeletingMultiple(true);
      let successCount = 0;
      let failCount = 0;
      for (const id of selectedRows) {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/transactions/${id}?userId=${userId}`);
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Lỗi xóa giao dịch ${id}:`, err);
        }
      }
      toast.showToast('info', 'Kết quả xóa', `Đã xóa ${successCount} giao dịch, thất bại ${failCount}`);
      fetchTransactions();
      if (onDataChange) onDataChange();
      setIsDeletingMultiple(false);
    }
  };

  return (
    <>
      <div className="p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div className="d-flex gap-2">
            <button onClick={onAdd} className="btn btn-primary d-flex align-items-center gap-2 shadow-sm">
              <PlusCircle size={18} /> Thêm giao dịch
            </button>
            {selectedRows.size > 0 && (
              <button
                onClick={deleteSelected}
                className="btn btn-outline-danger d-flex align-items-center gap-2"
                disabled={isDeletingMultiple}
              >
                <Trash2 size={18} /> Xóa đã chọn ({selectedRows.size})
              </button>
            )}
          </div>
          <div className="d-flex gap-2 flex-grow-1 justify-content-end max-w-400">
            <div className="input-group input-group-sm premium-search-group bg-light">
              <span className="input-group-text bg-transparent"><Search size={16} className="text-muted" /></span>
              <input
                type="text"
                className="form-control bg-transparent"
                placeholder="Tìm theo ghi chú..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className={`btn btn-sm ${showFilters ? 'btn-primary-blue' : 'btn-light'}`} onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} /> Lọc
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-4 p-4 border-0 bg-light rounded-3 transition-all">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">LOẠI GIAO DỊCH</label>
                <select className="form-select form-select-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="THU">Thu nhập</option>
                  <option value="CHI">Chi tiêu</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">TỪ NGÀY</label>
                <input type="date" className="form-control form-control-sm" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold text-muted">ĐẾN NGÀY</label>
                <input type="date" className="form-control form-control-sm" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="col-md-3 d-flex align-items-end">
                <button className="btn btn-light btn-sm w-100" onClick={resetFilters}>Làm mới</button>
              </div>
            </div>
          </div>
        )}

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedRows.size === filteredTransactions.length && filteredTransactions.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
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
                  <tr key={t.transactionId} className="transition-all">
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedRows.has(t.transactionId)}
                        onChange={() => toggleSelectRow(t.transactionId)}
                      />
                    </td>
                    <td className="small text-muted">{t.date}</td>
                    <td>
                      <span className={`badge ${t.type === 'THU' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                        {t.category?.categoryName || "Khác"}
                      </span>
                    </td>
                    <td className={`text-end fw-bold ${t.type === 'THU' ? 'text-success' : 'text-danger'}`}>
                      {t.type === 'THU' ? '+' : '-'}{(t.amount || 0).toLocaleString()}
                    </td>
                    <td className="text-main small">{t.note || '-'}</td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-1">
                        <button onClick={() => onEdit(t)} className="btn btn-sm btn-light text-primary-blue p-2"><Edit size={16} /></button>
                        <button onClick={() => confirmDelete(t.transactionId)} className="btn btn-sm btn-light text-danger p-2"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-5 text-muted">Không tìm thấy giao dịch nào</td></tr>
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