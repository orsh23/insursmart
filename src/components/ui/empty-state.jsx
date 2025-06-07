export default function EmptyState({ icon: Icon, title, message }) {
  return (
    <div className="text-center py-8">
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
      {title && <h3 className="mt-2 text-sm font-semibold text-gray-900">{title}</h3>}
      {message && <p className="mt-1 text-sm text-gray-500">{message}</p>}
    </div>
  );
}