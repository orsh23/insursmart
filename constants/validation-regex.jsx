// Common Regular Expressions for Validation

// Basic email regex (consider a more robust one if needed for edge cases)
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Example ILS Phone Regex (adjust as per specific requirements)
// Allows optional +, country code (972), optional 0, and then 8-9 digits.
// Handles formats like: +9725XXXXXXXX, 05XXXXXXXX, 9725XXXXXXXX
export const PHONE_REGEX_ILS = /^(?:\+972|0)?(?:-)?(?:5\d|7\d|2|3|4|8|9)(?:-)?(?:\d(?:-)?){7}$/; 
// Simpler general phone regex - you might want more specific ones per region if app is international
export const GENERAL_PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

// Example for a simple name (allows letters, spaces, hyphens, apostrophes)
export const NAME_REGEX = /^[a-zA-Zà-öø-ÿÀ-ÖØ-ß\s'-]+$/;

// URL Regex
export const URL_REGEX = /^(ftp|http|https):\/\/[^ "]+$/;

// Numeric only
export const NUMERIC_REGEX = /^[0-9]+$/;

// Alphanumeric
export const ALPHANUMERIC_REGEX = /^[a-zA-Z0-9]+$/;

// Israeli ID number (Teudat Zehut) - basic 9 digits check, checksum validation is more complex
export const ISRAELI_ID_REGEX = /^\d{9}$/;

// Add other frequently used regex patterns here