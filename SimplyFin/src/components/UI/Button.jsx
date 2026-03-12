export default function Button({
  children,
  variant = "primary",
  size = "md",
  width, // optional class string like 'w-full'
  className, // allow caller to pass extra classes (e.g. mt-6)
  ...props
}) {
  const variants = {
    primary: "bg-violet-500 text-white rounded-md border-violet-600 border-b-[4px] mb-[2px] hover:border-b-[6px] hover:brightness-110 hover:-translate-y-[1px] hover:mb-0 active:brightness-90 active:border-b-[2px] active:translate-y-[2px] active:mb-[4px]",
    secondary: "border border-violet-500 hover:bg-gray-100 shadow-md text-violet-600 hover:text-violet-700 rounded-xl active:bg-gray-300",
    outline: "hover:bg-gray-100 text-gray-600 underline active:bg-gray-200 active:no-underline",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-8 py-3 text-lg",
  };

  // Merge classes: base + size + variant + optional width + any className passed by caller
  const combinedClassName = [
    "cursor-pointer transition-all",
    variants[variant],
    sizes[size],
    width || "",
    className || "",
  ].filter(Boolean).join(" ");

  // spread remaining props (excludes className and width)
  return (
    <button
      {...props}
      className={combinedClassName}
    >
      {children}
    </button>
  );
}
