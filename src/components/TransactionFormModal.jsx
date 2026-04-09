import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Save, X, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TransactionFormModal = ({ userId, show, onClose, onTransactionAdded, editData }) => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    type: 'CHI',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
    category: { categoryId: '' }
  });
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('CHI');
  const [newCatLimit, setNewCatLimit] = useState('');

  const fetchCategories = async (type) => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories?type=${type}`);
      const unique = res.data.filter((cat, idx, self) =>
        idx === self.findIndex(c => c.categoryName === cat.categoryName && c.type === cat.type)
      );
      setCategories(unique);
    } catch (err) {
      console.error("Lỗi lấy danh mục", err);
    }
  };

  useEffect(() => {
    if (show) fetchCategories(formData.type);
  }, [show, formData.type]);

  useEffect(() => {
    if (editData) {
      setFormData({
        ...editData,
        category: { categoryId: editData.category?.categoryId || '' },
        date: editData.date || new Date().toISOString().split('T')[0],
        note: editData.note || ''
      });
    } else {
      setFormData({
        type: 'CHI',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        note: '',
        category: { categoryId: '' }
      });
    }
  }, [editData]);

  const handleTypeChange = (newType) => {
    setFormData({ ...formData, type: newType, category: { categoryId: '' } });
  };

  const handleClose = () => {
    setFormData({
      type: 'CHI',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      note: '',
      category: { categoryId: '' }
    });
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, user: { userId } };
      let res;
      if (formData.transactionId) {
        res = await axios.put(`${import.meta.env.VITE_API_URL}/api/transactions/${formData.transactionId}?userId=${userId}`, payload);
        toast.showToast('success', 'Sửa giao dịch thành công', res.data.budgetMessage || '');
      } else {
        res = await axios.post('${import.meta.env.VITE_API_URL}/api/transactions', payload);
        toast.showToast('success', 'Thêm giao dịch thành công', res.data.budgetMessage || '');
      }
      onTransactionAdded();
      handleClose();
    } catch (err) {
      toast.showToast('error', 'Lỗi lưu giao dịch', err.response?.data || err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const catRes = await axios.post('${import.meta.env.VITE_API_URL}/api/categories', {
        categoryName: newCatName,
        type: newCatType
      });
      const newCategory = catRes.data;
      if (newCatType === 'CHI' && newCatLimit) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await axios.post('${import.meta.env.VITE_API_URL}/api/budgets/set-limit', {
          user: { userId },
          category: { categoryId: newCategory.categoryId },
          month: currentMonth,
          categoryLimit: parseFloat(newCatLimit)
        });
      }
      await fetchCategories(formData.type);
      if (newCatType === formData.type) {
        setFormData(prev => ({ ...prev, category: { categoryId: newCategory.categoryId } }));
      } else {
        setFormData(prev => ({ ...prev, type: newCatType, category: { categoryId: newCategory.categoryId } }));
      }
      setShowCategoryModal(false);
      setNewCatName('');
      setNewCatType('CHI');
      setNewCatLimit('');
      toast.showToast('success', 'Thêm danh mục thành công', `Danh mục "${newCatName}" đã được tạo`);
    } catch (err) {
      toast.showToast('error', 'Thêm danh mục thất bại', err.response?.data || 'Đã xảy ra lỗi');
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1040 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg rounded-4">
            <div className="modal-header border-0 pb-0">
              <h5 className="fw-bold">{formData.transactionId ? "Chỉnh sửa giao dịch" : "Thêm giao dịch mới"}</h5>
              <button onClick={handleClose} className="btn-close"></button>
            </div>
            <form onSubmit={handleSave} className="modal-body p-4">
              <div className="mb-3">
                <label className="small text-muted fw-bold">LOẠI GIAO DỊCH</label>
                <div className="d-flex gap-2">
                  <button type="button" onClick={() => handleTypeChange('CHI')} className={`btn flex-fill fw-semibold ${formData.type === 'CHI' ? 'btn-danger' : 'btn-outline-danger'}`}>CHI TIÊU</button>
                  <button type="button" onClick={() => handleTypeChange('THU')} className={`btn flex-fill fw-semibold ${formData.type === 'THU' ? 'btn-success' : 'btn-outline-success'}`}>THU NHẬP</button>
                </div>
              </div>
              <div className="mb-3">
                <label className="small text-muted fw-bold">DANH MỤC</label>
                <div className="d-flex gap-2">
                  <select className="form-select flex-grow-1" required value={formData.category.categoryId} onChange={e => setFormData({ ...formData, category: { categoryId: e.target.value } })}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                  </select>
                  <button type="button" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onClick={() => setShowCategoryModal(true)}><Plus size={16} /> Thêm mới</button>
                </div>
              </div>
              <div className="mb-3">
                <label className="small text-muted fw-bold">SỐ TIỀN (VND)</label>
                <input type="number" className="form-control no-arrows" required placeholder="Ví dụ: 50000" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </div>
              <div className="mb-3">
                <label className="small text-muted fw-bold">NGÀY GIAO DỊCH</label>
                <div className="input-group">
                  <input type="date" className="form-control" required value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} id="transaction-date" />
                </div>
              </div>
              <div className="mb-4">
                <label className="small text-muted fw-bold">GHI CHÚ</label>
                <input type="text" className="form-control" placeholder="Mô tả ngắn gọn (không bắt buộc)..." value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2">
                {formData.transactionId ? "CẬP NHẬT GIAO DỊCH" : "LƯU GIAO DỊCH"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="fw-bold">Thêm danh mục mới</h5>
                <button onClick={() => setShowCategoryModal(false)} className="btn-close"></button>
              </div>
              <form onSubmit={handleCreateCategory} className="modal-body p-4">
                <div className="mb-3">
                  <label className="small text-muted fw-bold">Tên danh mục</label>
                  <input type="text" className="form-control" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="small text-muted fw-bold">Loại</label>
                  <select className="form-select" value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                    <option value="THU">Thu nhập</option>
                    <option value="CHI">Chi tiêu</option>
                  </select>
                </div>
                {newCatType === 'CHI' && (
                  <div className="mb-3">
                    <label className="small text-muted fw-bold">Hạn mức (VND)</label>
                    <input type="number" className="form-control" placeholder="VD: 5000000" value={newCatLimit} onChange={e => setNewCatLimit(e.target.value)} />
                  </div>
                )}
                <button type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-sm"><PlusCircle size={18} /> Thêm danh mục</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`.no-arrows::-webkit-inner-spin-button, .no-arrows::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }`}</style>
    </>
  );
};

export default TransactionFormModal;