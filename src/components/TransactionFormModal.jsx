import { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, Save, X, Plus } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { 
  validateTransactionType, 
  validateAmount, 
  validateTransactionDate, 
  validateNote, 
  validateCategoryName,
  validateOptionalAmount 
} from '../utils/validation';

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
  const [showAmountSuggestions, setShowAmountSuggestions] = useState(false);
  const [amountSuggestions, setAmountSuggestions] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [categoryValidationErrors, setCategoryValidationErrors] = useState({});

  const fetchCategories = async (type) => {
    if (!userId) return;
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories?type=${type}&userId=${userId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      const unique = data.filter((cat, idx, self) =>
        idx === self.findIndex(c => c.categoryName === cat.categoryName && c.type === cat.type)
      );
      setCategories(unique);
    } catch (err) {
      console.error("Lỗi lấy danh mục", err);
      setCategories([]);
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

  // Real-time validation for transaction form
  useEffect(() => {
    const errors = {};
    
    if (formData.amount) {
      const amountValidation = validateAmount(formData.amount);
      if (!amountValidation.isValid()) {
        errors.amount = amountValidation.getFirstError();
      }
    }
    
    if (formData.date) {
      const dateValidation = validateTransactionDate(formData.date);
      if (!dateValidation.isValid()) {
        errors.date = dateValidation.getFirstError();
      }
    }
    
    if (formData.note) {
      const noteValidation = validateNote(formData.note);
      if (!noteValidation.isValid()) {
        errors.note = noteValidation.getFirstError();
      }
    }
    
    setValidationErrors(errors);
  }, [formData.amount, formData.date, formData.note]);

  // Real-time validation for category form
  useEffect(() => {
    const errors = {};
    
    if (newCatName) {
      const nameValidation = validateCategoryName(newCatName);
      if (!nameValidation.isValid()) {
        errors.categoryName = nameValidation.getFirstError();
      }
    }
    
    if (newCatLimit) {
      const limitValidation = validateOptionalAmount(newCatLimit);
      if (!limitValidation.isValid()) {
        errors.categoryLimit = limitValidation.getFirstError();
      }
    }
    
    setCategoryValidationErrors(errors);
  }, [newCatName, newCatLimit]);

  const generateSuggestions = (value) => {
    if (!value || isNaN(parseFloat(value))) return [];
    const num = parseFloat(value);
    if (num === 0) return [];
    const base = num;
    const multipliers = [10, 100, 1000, 10000, 100000, 1000000];
    const suggestions = [];
    const maxLimit = 1_000_000_000_000; // Match validation limit
    for (let mult of multipliers) {
      const suggested = base * mult;
      if (suggested <= maxLimit && !suggestions.includes(suggested)) {
        suggestions.push(suggested);
      }
    }
    return suggestions.sort((a, b) => a - b);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    setFormData({ ...formData, amount: val });
    const suggestions = generateSuggestions(val);
    setAmountSuggestions(suggestions);
    setShowAmountSuggestions(suggestions.length > 0);
  };

  const selectSuggestion = (suggestedValue) => {
    setFormData({ ...formData, amount: suggestedValue.toString() });
    setShowAmountSuggestions(false);
  };

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
    setValidationErrors({});
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const typeValidation = validateTransactionType(formData.type);
    const amountValidation = validateAmount(formData.amount);
    const dateValidation = validateTransactionDate(formData.date);
    const noteValidation = validateNote(formData.note);
    
    const errors = {};
    if (!typeValidation.isValid()) {
      errors.type = typeValidation.getFirstError();
    }
    if (!amountValidation.isValid()) {
      errors.amount = amountValidation.getFirstError();
    }
    if (!dateValidation.isValid()) {
      errors.date = dateValidation.getFirstError();
    }
    if (!noteValidation.isValid()) {
      errors.note = noteValidation.getFirstError();
    }
    if (!formData.category.categoryId) {
      errors.category = 'Danh mục không được để trống';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.showToast('error', 'Lỗi validation', firstError);
      return;
    }
    
    try {
      const payload = { 
        ...formData, 
        user: { userId },
        amount: parseFloat(formData.amount),
        note: formData.note.trim() || null
      };
      let res;
      if (formData.transactionId) {
        res = await axios.put(`${import.meta.env.VITE_API_URL}/api/transactions/${formData.transactionId}?userId=${userId}`, payload);
        toast.showToast('success', 'Sửa giao dịch thành công', res.data.budgetMessage || '');
      } else {
        res = await axios.post(`${import.meta.env.VITE_API_URL}/api/transactions`, payload);
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
    
    // Validate category fields
    const nameValidation = validateCategoryName(newCatName);
    const typeValidation = validateTransactionType(newCatType);
    const limitValidation = newCatLimit ? validateOptionalAmount(newCatLimit) : { isValid: () => true };
    
    const errors = {};
    if (!nameValidation.isValid()) {
      errors.categoryName = nameValidation.getFirstError();
    }
    if (!typeValidation.isValid()) {
      errors.categoryType = typeValidation.getFirstError();
    }
    if (!limitValidation.isValid()) {
      errors.categoryLimit = limitValidation.getFirstError();
    }
    
    if (Object.keys(errors).length > 0) {
      setCategoryValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.showToast('error', 'Lỗi validation', firstError);
      return;
    }
    
    try {
      const catRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/categories`, {
        categoryName: newCatName.trim(),
        type: newCatType,
        user: { userId }
      });
      const newCategory = catRes.data;
      if (newCatType === 'CHI' && newCatLimit) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await axios.post(`${import.meta.env.VITE_API_URL}/api/budgets/set-limit`, {
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
      setCategoryValidationErrors({});
      toast.showToast('success', 'Thêm danh mục thành công', `Danh mục "${newCatName.trim()}" đã được tạo`);
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
                {validationErrors.type && (
                  <div className="invalid-feedback d-block small">{validationErrors.type}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="small text-muted fw-bold">DANH MỤC</label>
                <div className="d-flex gap-2">
                  <select 
                    className={`form-select flex-grow-1 ${validationErrors.category ? 'is-invalid' : ''}`}
                    required 
                    value={formData.category.categoryId} 
                    onChange={e => setFormData({ ...formData, category: { categoryId: e.target.value } })}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                  </select>
                  <button type="button" className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1" onClick={() => setShowCategoryModal(true)}><Plus size={16} /> Thêm mới</button>
                </div>
                {validationErrors.category && (
                  <div className="invalid-feedback d-block small">{validationErrors.category}</div>
                )}
              </div>
              <div className="mb-3">
                <label className="small text-muted fw-bold">SỐ TIỀN (VND)</label>
                <div className="position-relative">
                  <input
                    type="number"
                    className={`form-control no-arrows ${validationErrors.amount ? 'is-invalid' : ''}`}
                    required
                    placeholder="Ví dụ: 50000 (tối đa 1,000,000,000,000)"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    onBlur={() => setTimeout(() => setShowAmountSuggestions(false), 200)}
                    min="0.01"
                    max="1000000000000"
                    step="0.01"
                  />
                  {validationErrors.amount && (
                    <div className="invalid-feedback d-block small">{validationErrors.amount}</div>
                  )}
                  {showAmountSuggestions && amountSuggestions.length > 0 && (
                    <div className="position-absolute top-100 start-0 mt-1 w-100 bg-white border rounded shadow-sm z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {amountSuggestions.map((sug, idx) => (
                        <div key={idx} className="p-2 hover-bg-light cursor-pointer" style={{ cursor: 'pointer' }} onMouseDown={() => selectSuggestion(sug)}>
                          {sug.toLocaleString('vi-VN')}đ
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-3">
                <label className="small text-muted fw-bold">NGÀY GIAO DỊCH</label>
                <div className="input-group">
                  <input 
                    type="date" 
                    className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`}
                    required 
                    value={formData.date} 
                    onChange={e => setFormData({ ...formData, date: e.target.value })} 
                    max={new Date().toISOString().split('T')[0]}
                    id="transaction-date" 
                  />
                </div>
                {validationErrors.date && (
                  <div className="invalid-feedback d-block small">{validationErrors.date}</div>
                )}
              </div>
              <div className="mb-4">
                <label className="small text-muted fw-bold">GHI CHÚ</label>
                <input 
                  type="text" 
                  className={`form-control ${validationErrors.note ? 'is-invalid' : ''}`}
                  placeholder="Mô tả ngắn gọn (tối đa 255 ký tự)..." 
                  value={formData.note} 
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  maxLength="255"
                />
                {validationErrors.note && (
                  <div className="invalid-feedback d-block small">{validationErrors.note}</div>
                )}
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-100 py-2 fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2"
                disabled={Object.keys(validationErrors).length > 0}
              >
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
                <button onClick={() => {
                  setShowCategoryModal(false);
                  setCategoryValidationErrors({});
                }} className="btn-close"></button>
              </div>
              <form onSubmit={handleCreateCategory} className="modal-body p-4">
                <div className="mb-3">
                  <label className="small text-muted fw-bold">Tên danh mục</label>
                  <input 
                    type="text" 
                    className={`form-control ${categoryValidationErrors.categoryName ? 'is-invalid' : ''}`}
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    required 
                    placeholder="1-50 ký tự"
                    maxLength="50"
                  />
                  {categoryValidationErrors.categoryName && (
                    <div className="invalid-feedback d-block small">{categoryValidationErrors.categoryName}</div>
                  )}
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
                    <input 
                      type="number" 
                      className={`form-control ${categoryValidationErrors.categoryLimit ? 'is-invalid' : ''}`}
                      placeholder="VD: 5000000 (tùy chọn)" 
                      value={newCatLimit} 
                      onChange={e => setNewCatLimit(e.target.value)}
                      min="0.01"
                      max="1000000000000"
                      step="0.01"
                    />
                    {categoryValidationErrors.categoryLimit && (
                      <div className="invalid-feedback d-block small">{categoryValidationErrors.categoryLimit}</div>
                    )}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2 fw-bold shadow-sm"
                  disabled={Object.keys(categoryValidationErrors).length > 0}
                >
                  <PlusCircle size={18} /> Thêm danh mục
                </button>
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