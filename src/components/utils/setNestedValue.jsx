export default function setNestedValue(obj, path, value) {
  const segments = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  const result = Array.isArray(obj) ? [...obj] : { ...obj };
  let current = result;
  for (let i = 0; i < segments.length; i++) {
    const key = segments[i];
    if (i === segments.length - 1) {
      current[key] = value;
    } else {
      const nextKey = segments[i + 1];
      const isNextIndex = /^\d+$/.test(nextKey);
      if (current[key] === undefined) {
        current[key] = isNextIndex ? [] : {};
      } else {
        current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] };
      }
      current = current[key];
    }
  }
  return result;
}