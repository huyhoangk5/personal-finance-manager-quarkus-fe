import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PlusCircle, Edit3, Trash2, Save, X, Copy, Eye, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from './ConfirmationModal';

const CategoryBudgetManager = ({ userId, onDataChange }) => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('CHI');
  const [newLimit, setNewLimit] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editLimit, setEditLimit] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [spendingData, setSpendingData] = useState({});
  const [incomeData, setIncomeData] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showNewLimitSuggestions, setShowNewLimitSuggestions] = useState(false);
  const [newLimitSuggestions, setNewLimitSuggestions] = useState([]);
  const [showEditLimitSuggestions, setShowEditLimitSuggestions] = useState(false);
  const [editLimitSuggestions, setEditLimitSuggestions] = useState([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState(new Set());

  const fetchSpending = useCallback(async () => {
    if (!userId) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/spending-by-category-month?userId=${userId}&month=${currentMonth}`);
      setSpendingData(res.data);
    } catch (err) {
      console.error("Lỗi lấy chi tiêu theo tháng", err);
    }
  }, [userId]);

  const fetchIncome = useCallback(async () => {
    if (!userId) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/income-by-category-month?userId=${userId}&month=${currentMonth}`);
      setIncomeData(res.data);
    } catch (err) {
      console.error("Lỗi lấy thu nhập theo tháng", err);
    }
  }, [userId]);

  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories?userId=${userId}`);
      const unique = res.data.filter((cat, idx, self) =>
        idx === self.findIndex(c => c.categoryName === cat.categoryName && c.type === cat.type)
      );
      setCategories(unique);
    } catch (err) {
      console.error("Lỗi lấy danh mục", err);
    }
  }, [userId]);

  const fetchBudgets = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/budgets?userId=${userId}`);
      setBudgets(res.data);
    } catch (err) {
      console.error("Lỗi lấy hạn mức", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
    fetchSpending();
    fetchIncome();
  }, [fetchCategories, fetchBudgets, fetchSpending, fetchIncome]);

  const getCurrentBudget = (categoryId) => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const budget = budgets.find(b => b.category?.categoryId === categoryId && b.month === currentMonth);
    return budget ? budget.categoryLimit : 0;
  };

  const getStatus = (spent, limit) => {
    if (limit <= 0) return null;
    const percent = (spent / limit) * 100;
    if (percent > 100) return { text: 'Vượt', class: 'bg-danger' };
    if (percent >= 80) return { text: 'Cảnh báo', class: 'bg-warning text-dark' };
    return null;
  };

  const generateSuggestions = (value) => {
    if (!value || isNaN(parseFloat(value))) return [];
    const num = parseFloat(value);
    if (num === 0) return [];
    const base = num;
    const multipliers = [10, 100, 1000, 10000, 100000, 1000000];
    const suggestions = [];
    const maxLimit = 10_000_000_000; // 10 tỷ
    for (let mult of multipliers) {
      const suggested = base * mult;
      if (suggested <= maxLimit && !suggestions.includes(suggested)) {
        suggestions.push(suggested);
      }
    }
    return suggestions.sort((a, b) => a - b);
  };

  const handleNewLimitChange = (e) => {
    const val = e.target.value;
    setNewLimit(val);
    const suggestions = generateSuggestions(val);
    setNewLimitSuggestions(suggestions);
    setShowNewLimitSuggestions(suggestions.length > 0);
  };

  const handleEditLimitChange = (e) => {
    const val = e.target.value;
    setEditLimit(val);
    const suggestions = generateSuggestions(val);
    setEditLimitSuggestions(suggestions);
    setShowEditLimitSuggestions(suggestions.length > 0);
  };

  const selectNewLimitSuggestion = (val) => {
    setNewLimit(val.toString());
    setShowNewLimitSuggestions(false);
  };

  const selectEditLimitSuggestion = (val) => {
    setEditLimit(val.toString());
    setShowEditLimitSuggestions(false);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const catRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, {
        categoryName: newName,
        type: newType,
        user: { userId }
      });
      const newCategory = catRes.data;
      if (newType === 'CHI' && newLimit) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await axios.post(`${import.meta.env.VITE_API_URL}/api/budgets/set-limit`, {
          user: { userId },
          category: { categoryId: newCategory.categoryId },
          month: currentMonth,
          categoryLimit: parseFloat(newLimit)
        });
      }
      setNewName('');
      setNewType('CHI');
      setNewLimit('');
      setShowForm(false);
      fetchCategories();
      fetchBudgets();
      if (onDataChange) onDataChange();
      toast.showToast('success', 'Thêm danh mục thành công', `Danh mục "${newName}" đã được tạo`);
    } catch (err) {
      toast.showToast('error', 'Thêm danh mục thất bại', err.response?.data || 'Đã xảy ra lỗi');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${editingCategory.categoryId}?userId=${userId}`, {
        categoryName: editName,
        type: editType
      });
      if (editType === 'CHI') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await axios.post(`${import.meta.env.VITE_API_URL}/api/budgets/set-limit`, {
          user: { userId },
          category: { categoryId: editingCategory.categoryId },
          month: currentMonth,
          categoryLimit: parseFloat(editLimit)
        });
      }
      setEditingCategory(null);
      setShowEditModal(false);
      fetchCategories();
      fetchBudgets();
      if (onDataChange) onDataChange();
      toast.showToast('success', 'Cập nhật danh mục thành công', `Danh mục "${editName}" đã được cập nhật`);
    } catch (err) {
      toast.showToast('error', 'Cập nhật thất bại', err.response?.data || 'Đã xảy ra lỗi');
    }
  };

  const confirmDelete = (id, name) => {
    setDeleteTarget({ id, name });
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${deleteTarget.id}?userId=${userId}`);
      fetchCategories();
      fetchBudgets();
      if (onDataChange) onDataChange();
      toast.showToast('success', 'Xóa danh mục thành công', `Đã xóa danh mục "${deleteTarget.name}"`);
    } catch (err) {
      toast.showToast('error', 'Xóa danh mục thất bại', err.response?.data || 'Đã xảy ra lỗi');
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditModal = (cat) => {
    const currentLimit = cat.type === 'CHI' ? getCurrentBudget(cat.categoryId) : 0;
    setEditingCategory(cat);
    setEditName(cat.categoryName);
    setEditType(cat.type);
    setEditLimit(currentLimit);
    setShowEditModal(true);
  };

  const handleCopyLastMonth = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/budgets/copy-last-month?userId=${userId}`);
      toast.showToast('success', 'Sao chép hạn mức', res.data);
      fetchBudgets();
    } catch (err) {
      toast.showToast('error', 'Sao chép thất bại', err.response?.data || 'Đã xảy ra lỗi');
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="ms-1 text-muted" />;
    return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="ms-1" /> : <ArrowDown size={12} className="ms-1" />;
  };

  const expenseCategoriesRaw = categories.filter(cat => cat.type === 'CHI');
  const expenseData = expenseCategoriesRaw.map(cat => ({
    ...cat,
    currentLimit: getCurrentBudget(cat.categoryId),
    spent: spendingData[cat.categoryName] || 0,
    status: getStatus(spendingData[cat.categoryName] || 0, getCurrentBudget(cat.categoryId))
  }));
  const sortedExpenseData = [...expenseData];
  if (sortConfig.key) {
    sortedExpenseData.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'limit') { aVal = a.currentLimit; bVal = b.currentLimit; }
      else if (sortConfig.key === 'spent') { aVal = a.spent; bVal = b.spent; }
      else return 0;
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  const incomeCategories = categories.filter(cat => cat.type === 'THU');

  const deleteSelectedExpenses = async () => {
    if (selectedExpenseIds.size === 0) {
      toast.showToast('warning', 'Chưa chọn', 'Vui lòng chọn danh mục cần xóa');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedExpenseIds.size} danh mục chi tiêu đã chọn?`)) {
      let successCount = 0;
      let failCount = 0;
      for (const id of selectedExpenseIds) {
        try {
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${id}?userId=${userId}`);
          successCount++;
        } catch (err) {
          failCount++;
          console.error(`Lỗi xóa danh mục ${id}:`, err);
        }
      }
      toast.showToast('info', 'Kết quả xóa', `Đã xóa ${successCount} danh mục, thất bại ${failCount}`);
      fetchCategories();
      fetchBudgets();
      if (onDataChange) onDataChange();
      setSelectedExpenseIds(new Set());
    }
  };

  return (
    <div className="bg-white">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h5 className="fw-bold m-0 text-main">Ngân sách & Danh mục</h5>
          <p className="text-muted small m-0">Quản lý hạn mức chi tiêu hàng tháng</p>
        </div>
        <div className="d-flex gap-2">
          <button onClick={handleCopyLastMonth} className="btn btn-light btn-sm d-flex align-items-center gap-2">
            <Copy size={16} /> Sao chép tháng trước
          </button>
          <button onClick={() => setShowForm(!showForm)} className={`btn btn-sm d-flex align-items-center gap-2 ${showForm ? 'btn-light' : 'btn-primary'}`}>
            {showForm ? <X size={16} /> : <PlusCircle size={16} />} 
            {showForm ? 'Hủy bỏ' : 'Thêm danh mục'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-light rounded-3 transition-all border-0">
          <h6 className="fw-bold mb-3 small text-uppercase text-muted">Tạo danh mục mới</h6>
          <form onSubmit={handleCreateCategory} className="row g-3 align-items-end">
            <div className="col-md-4">
              <label className="form-label small fw-bold">Tên danh mục</label>
              <input type="text" className="form-control" placeholder="Tên danh mục..." value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small fw-bold">Loại</label>
              <select className="form-select" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="THU">Thu nhập</option>
                <option value="CHI">Chi tiêu</option>
              </select>
            </div>
            {newType === 'CHI' && (
              <div className="col-md-3">
                <label className="form-label small fw-bold">Hạn mức (VND)</label>
                <div className="position-relative">
                  <input
                    type="number"
                    className="form-control no-arrows"
                    placeholder="VD: 5,000,000"
                    value={newLimit}
                    onChange={handleNewLimitChange}
                    onBlur={() => setTimeout(() => setShowNewLimitSuggestions(false), 200)}
                  />
                  {showNewLimitSuggestions && newLimitSuggestions.length > 0 && (
                    <div className="position-absolute top-100 start-0 mt-1 w-100 bg-white border-0 shadow-lg rounded-3 z-3 overflow-hidden">
                      {newLimitSuggestions.map((sug, idx) => (
                        <div key={idx} className="p-2 hover-bg-light cursor-pointer small border-bottom" onMouseDown={() => selectNewLimitSuggestion(sug)}>
                          {sug.toLocaleString('vi-VN')}đ
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="col-md-2">
              <button type="submit" className="btn btn-primary w-100 py-2">Lưu lại</button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-4 mt-2">
        <div className="col-lg-5">
          <div className="p-4 bg-white rounded-4 h-100 shadow-sm border border-light">
            <h6 className="mb-4 text-dark fw-bold d-flex align-items-center gap-2">
              <div className="p-1 bg-success rounded-circle text-white" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></div>
              </div>
              Thu nhập tháng này
            </h6>
            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <thead>
                  <tr className="text-dark small fw-bold">
                    <th>DANH MỤC</th>
                    <th className="text-end">TỔNG THU</th>
                    <th className="text-center">#</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeCategories.map((cat) => (
                    <tr key={cat.categoryId} className="bg-light bg-opacity-50 rounded-3 mb-2 border-bottom border-white">
                      <td data-label="Danh mục" className="fw-bold py-3">{cat.categoryName}</td>
                      <td data-label="Tổng thu" className="text-end fw-bold text-success">{(incomeData[cat.categoryName] || 0).toLocaleString()}đ</td>
                      <td data-label="Thao tác" className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          <button onClick={() => openEditModal(cat)} className="btn btn-sm btn-light text-primary-blue p-2"><Edit3 size={14} /></button>
                          <button onClick={() => confirmDelete(cat.categoryId, cat.categoryName)} className="btn btn-sm btn-light text-danger p-2"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {incomeCategories.length === 0 && <tr><td colSpan="3" className="text-center text-muted py-5 small">Chưa có danh mục thu nhập</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="p-4 bg-white rounded-4 h-100 shadow-sm border border-light">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h6 className="mb-0 text-dark fw-bold d-flex align-items-center gap-2">
                <div className="p-1 bg-danger rounded-circle text-white" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }}></div>
                </div>
                Chi tiêu & Hạn mức
              </h6>
              {selectedExpenseIds.size > 0 && (
                <button onClick={deleteSelectedExpenses} className="btn btn-sm btn-danger shadow-sm">
                  Xóa {selectedExpenseIds.size} mục
                </button>
              )}
            </div>
            <div className="table-responsive">
              <table className="table table-borderless align-middle">
                <thead>
                  <tr className="text-dark small fw-bold">
                    <th style={{ width: '30px' }}>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedExpenseIds.size === expenseCategoriesRaw.length && expenseCategoriesRaw.length > 0}
                        onChange={() => {
                          if (selectedExpenseIds.size === expenseCategoriesRaw.length) {
                            setSelectedExpenseIds(new Set());
                          } else {
                            setSelectedExpenseIds(new Set(expenseCategoriesRaw.map(c => c.categoryId)));
                          }
                        }}
                      />
                    </th>
                    <th>DANH MỤC</th>
                    <th className="text-end cursor-pointer" onClick={() => requestSort('limit')}>HẠN MỨC {getSortIcon('limit')}</th>
                    <th className="text-end cursor-pointer" onClick={() => requestSort('spent')}>ĐÃ CHI {getSortIcon('spent')}</th>
                    <th className="text-center">#</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenseData.map((cat) => {
                    const percent = cat.currentLimit > 0 ? (cat.spent / cat.currentLimit) * 100 : 0;
                    return (
                      <tr key={cat.categoryId} className="bg-light bg-opacity-50 rounded-3 border-bottom border-white">
                        <td>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedExpenseIds.has(cat.categoryId)}
                            onChange={() => {
                              const newSelected = new Set(selectedExpenseIds);
                              if (newSelected.has(cat.categoryId)) {
                                newSelected.delete(cat.categoryId);
                              } else {
                                newSelected.add(cat.categoryId);
                              }
                              setSelectedExpenseIds(newSelected);
                            }}
                          />
                        </td>
                        <td data-label="Danh mục" className="fw-bold py-3">{cat.categoryName}</td>
                        <td data-label="Hạn mức" className="text-end fw-bold">{cat.currentLimit.toLocaleString()}đ</td>
                        <td data-label="Đã chi" className="text-end">
                          <div className="d-flex flex-column align-items-end">
                            <span className={`fw-bold ${percent > 100 ? 'text-danger' : 'text-main'}`}>{cat.spent.toLocaleString()}đ</span>
                            {cat.currentLimit > 0 && (
                              <div className="progress w-100 mt-1" style={{ height: '6px', maxWidth: '100px' }}>
                                <div className={`progress-bar ${percent > 100 ? 'bg-danger' : percent > 80 ? 'bg-warning' : 'bg-primary-blue'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td data-label="Thao tác" className="text-center">
                          <div className="d-flex justify-content-center gap-1">
                            <button onClick={() => openEditModal(cat)} className="btn btn-sm btn-light text-primary-blue p-2"><Edit3 size={14} /></button>
                            <button onClick={() => confirmDelete(cat.categoryId, cat.categoryName)} className="btn btn-sm btn-light text-danger p-2"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {expenseCategoriesRaw.length === 0 && <tr><td colSpan="5" className="text-center text-muted py-5 small">Chưa có danh mục chi tiêu</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && editingCategory && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0"><h5 className="fw-bold">Chỉnh sửa danh mục</h5><button onClick={() => setShowEditModal(false)} className="btn-close"></button></div>
              <div className="modal-body p-4">
                <div className="mb-3"><label className="small text-muted fw-bold">Tên danh mục</label><input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} /></div>
                <div className="mb-3"><label className="small text-muted fw-bold">Loại</label><select className="form-select" value={editType} onChange={e => setEditType(e.target.value)}><option value="THU">Thu nhập</option><option value="CHI">Chi tiêu</option></select></div>
                {editType === 'CHI' && (
                  <div className="mb-3 position-relative">
                    <label className="small text-muted fw-bold">Hạn mức (VND)</label>
                    <input
                      type="number"
                      className="form-control no-arrows"
                      value={editLimit}
                      onChange={handleEditLimitChange}
                      onBlur={() => setTimeout(() => setShowEditLimitSuggestions(false), 200)}
                    />
                    {showEditLimitSuggestions && editLimitSuggestions.length > 0 && (
                      <div className="position-absolute top-100 start-0 mt-1 w-100 bg-white border rounded shadow-sm z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {editLimitSuggestions.map((sug, idx) => (
                          <div key={idx} className="p-2 hover-bg-light cursor-pointer" style={{ cursor: 'pointer' }} onMouseDown={() => selectEditLimitSuggestion(sug)}>
                            {sug.toLocaleString('vi-VN')}đ
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <button onClick={handleUpdateCategory} className="btn btn-primary w-100 py-2 fw-bold shadow-sm"> Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        show={deleteTarget !== null}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa danh mục "${deleteTarget?.name}" không? Hành động này sẽ xóa tất cả giao dịch và hạn mức liên quan.`}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CategoryBudgetManager;