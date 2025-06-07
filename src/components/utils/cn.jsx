
/**
 * Combines class names without external dependencies.
 * Simple version that concatenates classes and handles basic conditional logic.
 * @param {...(string|object|array|null|undefined)} inputs - Class names or conditional class objects
 * @returns {string} - Combined class names
 */
export function cn(...inputs) {
  const classes = [];

  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object' && input !== null) {
      if (Array.isArray(input)) {
        // Recursively process array inputs
        const innerClasses = cn(...input);
        if (innerClasses) {
          classes.push(innerClasses);
        }
      } else {
        // Process object inputs
        for (const key in input) {
          if (Object.prototype.hasOwnProperty.call(input, key) && input[key]) {
            classes.push(key);
          }
        }
      }
    }
  }
  
  // Filter out empty strings and join with space
  return classes.filter(Boolean).join(' ');
}

export default cn;
