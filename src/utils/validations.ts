
/**
 * Validates a phone number based on the following criteria:
 * - Must be numeric only (no alpha characters)
 * - Must be between 10-12 digits in length
 * 
 * @param phone Phone number to validate
 * @returns True if valid, false if invalid
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Check if the phone number has only digits
  if (!/^\d+$/.test(phone)) {
    return false;
  }
  
  // Check if the phone number has a valid length (10-12 digits)
  if (phone.length < 10 || phone.length > 12) {
    return false;
  }
  
  return true;
};
