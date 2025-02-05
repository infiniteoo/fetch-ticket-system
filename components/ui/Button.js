export function Button({
  children,
  onClick,
  variant = "default",
  disabled = false,
}) {
  const baseStyles = "px-4 py-2 rounded font-semibold";
  const styles = {
    default: "bg-gray-600 text-white hover:bg-gray-700",
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${styles[variant]} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
