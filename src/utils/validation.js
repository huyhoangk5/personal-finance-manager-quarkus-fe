// Frontend validation utility based on Excel requirements

// Regex patterns
const USERNAME_PATTERN = /^[a-zA-Z0-9.@_-]{3,50}$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,16}$/;
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const FULLNAME_PATTERN = /^[a-zA-ZÀ-ỹ\s\.]{1,100}$/;
const PHONE_PATTERN = /^0\d{9,10}$/;
const OTP_PATTERN = /^\d{6}$/;
const CATEGORY_NAME_PATTERN = /^[a-zA-ZÀ-ỹ\s]{1,50}$/;

// Constants
const MAX_AMOUNT = 1_000_000_000_000; // 10^12
const MAX_NOTE_LENGTH = 255;
const MAX_CATEGORY_NAME_LENGTH = 50;
const MAX_SEARCH_KEYWORD_LENGTH = 100;

// Validation result class
class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
  }

  addError(error) {
    this.valid = false;
    this.errors.push(error);
  }

  isValid() {
    return this.valid;
  }

  getErrors() {
    return this.errors;
  }

  getFirstError() {
    return this.errors.length > 0 ? this.errors[0] : null;
  }
}

// Username validation (STT 1, 4)
export const validateUsername = (username) => {
  const result = new ValidationResult();
  
  if (!username || username.trim() === '') {
    result.addError('Tên đăng nhập không được để trống');
    return result;
  }
  
  const trimmedUsername = username.trim();
  
  if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
    result.addError('Tên đăng nhập phải từ 3-50 ký tự');
  }
  
  if (!USERNAME_PATTERN.test(trimmedUsername)) {
    result.addError('Tên đăng nhập không hợp lệ');
  }
  
  return result;
};

// Password validation (STT 2, 19, 24)
export const validatePassword = (password) => {
  const result = new ValidationResult();
  
  if (!password) {
    result.addError('Mật khẩu không được để trống');
    return result;
  }
  
  if (password.length < 6 || password.length > 16) {
    result.addError('Mật khẩu phải từ 6-16 ký tự');
  }
  
  if (password.includes(' ')) {
    result.addError('Mật khẩu không được chứa khoảng trắng');
  }
  
  if (!PASSWORD_PATTERN.test(password)) {
    result.addError('Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
  }
  
  return result;
};

// Password confirmation validation (STT 3, 20, 25)
export const validatePasswordConfirmation = (password, confirmPassword) => {
  const result = new ValidationResult();
  
  if (!confirmPassword) {
    result.addError('Xác nhận mật khẩu không được để trống');
    return result;
  }
  
  if (password !== confirmPassword) {
    result.addError('Mật khẩu xác nhận không khớp');
  }
  
  return result;
};

// Email validation (STT 18, 22, 30, 33)
export const validateEmail = (email) => {
  const result = new ValidationResult();
  
  if (!email || email.trim() === '') {
    result.addError('Email không được để trống');
    return result;
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!EMAIL_PATTERN.test(trimmedEmail)) {
    result.addError('Email không đúng định dạng');
  }
  
  return result;
};

// Full name validation (STT 21)
export const validateFullName = (fullName) => {
  const result = new ValidationResult();
  
  if (fullName && fullName.trim() !== '') {
    const trimmedName = fullName.trim();
    
    if (trimmedName.length > 100) {
      result.addError('Họ và tên không được vượt quá 100 ký tự');
    }
    
    if (!FULLNAME_PATTERN.test(trimmedName)) {
      result.addError('Họ và tên chỉ được chứa chữ cái, khoảng trắng và dấu chấm');
    }
  }
  
  return result;
};

// Transaction type validation (STT 6, 12, 15, 26)
export const validateTransactionType = (type) => {
  const result = new ValidationResult();
  
  if (!type || type.trim() === '') {
    result.addError('Loại giao dịch không được để trống');
    return result;
  }
  
  if (!['THU', 'CHI', 'all'].includes(type)) {
    result.addError('Loại giao dịch chỉ được nhận THU, CHI hoặc all');
  }
  
  return result;
};

// Amount validation (STT 8, 13, 16, 17)
export const validateAmount = (amount) => {
  const result = new ValidationResult();
  
  if (amount === null || amount === undefined || amount === '') {
    result.addError('Số tiền không được để trống');
    return result;
  }
  
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    result.addError('Số tiền phải là số hợp lệ');
    return result;
  }
  
  if (numAmount <= 0) {
    result.addError('Số tiền phải là số dương lớn hơn 0');
  }
  
  if (numAmount > MAX_AMOUNT) {
    result.addError(`Số tiền không được vượt quá ${MAX_AMOUNT.toLocaleString()}`);
  }
  
  return result;
};

// Optional amount validation for budget limit
export const validateOptionalAmount = (amount) => {
  const result = new ValidationResult();
  
  if (amount !== null && amount !== undefined && amount !== '') {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount)) {
      result.addError('Hạn mức phải là số hợp lệ');
      return result;
    }
    
    if (numAmount <= 0) {
      result.addError('Hạn mức phải là số dương lớn hơn 0');
    }
    
    if (numAmount > MAX_AMOUNT) {
      result.addError(`Hạn mức không được vượt quá ${MAX_AMOUNT.toLocaleString()}`);
    }
  }
  
  return result;
};

// Date validation (STT 9, 27, 28)
export const validateTransactionDate = (date) => {
  const result = new ValidationResult();
  
  if (!date) {
    result.addError('Ngày giao dịch không được để trống');
    return result;
  }
  
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today
  
  if (inputDate > today) {
    result.addError('Ngày giao dịch không được lớn hơn ngày hiện tại');
  }
  
  return result;
};

// Date range validation (STT 27, 28)
export const validateDateRange = (fromDate, toDate) => {
  const result = new ValidationResult();
  
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (fromDate) {
    const from = new Date(fromDate);
    if (from > today) {
      result.addError('Từ ngày không được lớn hơn ngày hiện tại');
    }
  }
  
  if (toDate) {
    const to = new Date(toDate);
    if (to > today) {
      result.addError('Đến ngày không được lớn hơn ngày hiện tại');
    }
  }
  
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      result.addError('Từ ngày không được lớn hơn đến ngày');
    }
  }
  
  return result;
};

// Note validation (STT 10)
export const validateNote = (note) => {
  const result = new ValidationResult();
  
  if (note && note.length > MAX_NOTE_LENGTH) {
    result.addError(`Ghi chú không được vượt quá ${MAX_NOTE_LENGTH} ký tự`);
  }
  
  return result;
};

// Category name validation (STT 11, 14)
export const validateCategoryName = (categoryName) => {
  const result = new ValidationResult();
  
  if (!categoryName || categoryName.trim() === '') {
    result.addError('Tên danh mục không được để trống');
    return result;
  }
  
  const trimmedName = categoryName.trim();
  
  if (trimmedName.length < 1 || trimmedName.length > MAX_CATEGORY_NAME_LENGTH) {
    result.addError(`Tên danh mục phải từ 1-${MAX_CATEGORY_NAME_LENGTH} ký tự`);
  }
  
  if (!CATEGORY_NAME_PATTERN.test(trimmedName)) {
    result.addError('Tên danh mục chỉ được chứa chữ cái tiếng Việt và khoảng trắng, không chứa ký tự đặc biệt hoặc số');
  }
  
  return result;
};

// Search keyword validation (STT 29)
export const validateSearchKeyword = (keyword) => {
  const result = new ValidationResult();
  
  if (keyword && keyword.length > MAX_SEARCH_KEYWORD_LENGTH) {
    result.addError(`Từ khóa tìm kiếm không được vượt quá ${MAX_SEARCH_KEYWORD_LENGTH} ký tự`);
  }
  
  return result;
};

// Phone number validation (STT 31)
export const validatePhoneNumber = (phoneNumber) => {
  const result = new ValidationResult();
  
  if (!phoneNumber || phoneNumber.trim() === '') {
    result.addError('Số điện thoại không được để trống');
    return result;
  }
  
  const trimmedPhone = phoneNumber.trim();
  
  if (!PHONE_PATTERN.test(trimmedPhone)) {
    result.addError('Số điện thoại phải có 10-11 số và bắt đầu bằng số 0');
  }
  
  return result;
};

// OTP validation (STT 32)
export const validateOtp = (otp) => {
  const result = new ValidationResult();
  
  if (!otp || otp.trim() === '') {
    result.addError('Mã OTP không được để trống');
    return result;
  }
  
  const trimmedOtp = otp.trim();
  
  if (!OTP_PATTERN.test(trimmedOtp)) {
    result.addError('Mã OTP phải có đúng 6 chữ số');
  }
  
  return result;
};

// Utility functions
export const normalizeString = (input) => {
  return input ? input.trim() : null;
};

export const normalizeCategoryName = (categoryName) => {
  return categoryName ? categoryName.trim().toLowerCase() : null;
};

// Form validation helper
export const validateForm = (fields, validationRules) => {
  const errors = {};
  let isValid = true;
  
  Object.keys(validationRules).forEach(fieldName => {
    const value = fields[fieldName];
    const rules = validationRules[fieldName];
    
    for (const rule of rules) {
      const result = rule(value);
      if (!result.isValid()) {
        errors[fieldName] = result.getFirstError();
        isValid = false;
        break; // Stop at first error for this field
      }
    }
  });
  
  return { isValid, errors };
};

// Real-time validation helper for React components
export const useFieldValidation = (value, validationRules) => {
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (validationRules && validationRules.length > 0) {
      for (const rule of validationRules) {
        const result = rule(value);
        if (!result.isValid()) {
          setError(result.getFirstError());
          return;
        }
      }
      setError('');
    }
  }, [value, validationRules]);
  
  return error;
};