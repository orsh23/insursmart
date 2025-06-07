export default function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col items-center py-4" role="status">
      <svg className="animate-spin h-5 w-5 mr-3 text-gray-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 000 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
      </svg>
      {message && <span className="text-sm text-gray-600 mt-2">{message}</span>}
    </div>
  );
}
