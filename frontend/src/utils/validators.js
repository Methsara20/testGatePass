export const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  export const validatePassword = (password) => {
    return password.length >= 6;
  };
  
  export const validateRequired = (value) => {
    return value !== '' && value !== null && value !== undefined;
  };