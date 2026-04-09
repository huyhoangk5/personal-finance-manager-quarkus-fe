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
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }

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
    try {
      const res = await axios.get('${import.meta.env.VITE_API_URL}/api/categories');
      const unique = res.data.filter((cat, idx, self) =>
        idx === self.findIndex(c => c.categoryName === cat.categoryName && c.type === cat.type)
      );
      setCategories(unique);
    } catch (err) {
      console.error("Lỗi lấy danh mục", err);
    }
  }, []);

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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const catRes = await axios.post('${import.meta.env.VITE_API_URL}/api/categories', {
        categoryName: newName,
        type: newType
      });
      const newCategory = catRes.data;
      if (newType === 'CHI' && newLimit) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await axios.post('${import.meta.env.VITE_API_URL}/api/budgets/set-limit', {
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
      await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/${editingCategory.categoryId}`, {
        categoryName: editName,
        type: editType
      });
      if (editType === 'CHI') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await axios.post('${import.meta.env.VITE_API_URL}/api/budgets/set-limit', {
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
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/categories/${deleteTarget.id}`);
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

  return (
    <div className="card border-0 shadow-sm p-4 rounded-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold m-0 d-flex align-items-center gap-2">Ngân sách hàng tháng</h5>
        <div className="d-flex gap-2">
          <button onClick={handleCopyLastMonth} className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1"><Copy size={16} /> Sao chép hạn mức tháng trước</button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm d-flex align-items-center gap-1"><PlusCircle size={16} /> Thêm danh mục</button>
        </div>
      </div>

      {showForm && (
        <div className="mb-4 p-3 border rounded bg-light">
          <form onSubmit={handleCreateCategory} className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label small">Tên danh mục</label>
              <input type="text" className="form-control" value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Loại</label>
              <select className="form-select" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="THU">Thu nhập</option>
                <option value="CHI">Chi tiêu</option>
              </select>
            </div>
            {newType === 'CHI' && (
              <div className="col-md-3">
                <label className="form-label small">Hạn mức (VND)</label>
                <input type="number" className="form-control" placeholder="VD: 5000000" value={newLimit} onChange={e => setNewLimit(e.target.value)} />
              </div>
            )}
            <div className="col-md-2"><button type="submit" className="btn btn-success w-100">Lưu</button></div>
          </form>
          <center><button onClick={() => setShowForm(false)} className="btn btn-link btn-sm text-muted mt-2">Hủy</button></center>
        </div>
      )}

      <div className="row g-4">
        <div className="col-md-5">
          <div className="border rounded-3 p-3 h-100 bg-light bg-opacity-50">
            <h6 className="mb-3 text-success fw-bold">💰 Thu nhập</h6>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead className="small text-muted">
                  <tr><th style={{ width: '50px' }}>STT</th><th>Tên danh mục</th><th className="text-end">Tổng thu tháng này</th><th className="text-center" style={{ width: '70px' }}>Thao tác</th></tr>
                </thead>
                <tbody>
                  {incomeCategories.map((cat, idx) => (
                    <tr key={cat.categoryId}>
                      <td className="text-center">{idx+1}</td>
                      <td className="fw-bold">{cat.categoryName}</td>
                      <td className="text-end fw-bold text-success">{(incomeData[cat.categoryName] || 0).toLocaleString()}đ</td>
                      <td className="text-center">
                        <button onClick={() => openEditModal(cat)} className="btn btn-link text-primary p-0 me-1"><Edit3 size={14} /></button>
                        <button onClick={() => confirmDelete(cat.categoryId, cat.categoryName)} className="btn btn-link text-danger p-0"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {incomeCategories.length === 0 && <tr><td colSpan="4" className="text-center text-muted py-2">Chưa có danh mục thu nhập</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          <div className="border rounded-3 p-3 h-100 bg-light bg-opacity-50">
            <h6 className="mb-3 text-danger fw-bold">📊 Chi tiêu</h6>
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead className="small text-muted">
                  <tr><th style={{ width: '50px' }}>STT</th><th>Tên danh mục</th><th className="text-end cursor-pointer" onClick={() => requestSort('limit')}>Hạn mức {getSortIcon('limit')}</th><th className="text-end cursor-pointer" onClick={() => requestSort('spent')}>Đã chi {getSortIcon('spent')}</th><th className="text-center">Trạng thái</th><th className="text-center" style={{ width: '70px' }}>Thao tác</th></tr>
                </thead>
                <tbody>
                  {sortedExpenseData.map((cat, idx) => {
                    const percent = cat.currentLimit > 0 ? (cat.spent / cat.currentLimit) * 100 : 0;
                    return (
                      <tr key={cat.categoryId}>
                        <td className="text-center">{idx+1}</td>
                        <td className="fw-bold">{cat.categoryName}</td>
                        <td className="text-end"><span className="fw-bold">{cat.currentLimit.toLocaleString()}đ</span></td>
                        <td className="text-end">
                          <div><span className="fw-bold">{cat.spent.toLocaleString()}đ</span>
                            {cat.currentLimit > 0 && <div className="progress mt-1" style={{ height: '4px' }}><div className={`progress-bar ${percent > 100 ? 'bg-danger' : percent > 80 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${Math.min(percent,100)}%` }}></div></div>}
                          </div>
                        </td>
                        <td className="text-center">{cat.status ? <span className={`badge ${cat.status.class} px-2 py-1`}>{cat.status.text}</span> : <span className="badge bg-success px-2 py-1">Bình thường</span>}</td>
                        <td className="text-center">
                          <button onClick={() => openEditModal(cat)} className="btn btn-link text-primary p-0 me-1"><Edit3 size={14} /></button>
                          <button onClick={() => confirmDelete(cat.categoryId, cat.categoryName)} className="btn btn-link text-danger p-0"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    );
                  })}
                  {expenseCategoriesRaw.length === 0 && <tr><td colSpan="6" className="text-center text-muted py-2">Chưa có danh mục chi tiêu</td></tr>}
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
                {editType === 'CHI' && (<div className="mb-3"><label className="small text-muted fw-bold">Hạn mức (VND)</label><input type="number" className="form-control" value={editLimit} onChange={e => setEditLimit(e.target.value)} /></div>)}
                <button onClick={handleUpdateCategory} className="btn btn-primary w-100 py-2 fw-bold shadow-sm"> Lưu thay đổi</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal xác nhận xóa */}
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