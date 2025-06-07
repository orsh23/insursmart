export function Button({ variant = 'default', size = 'md', className = '', ...props }) {
  return (
    <button className={className} {...props} />
  );
}