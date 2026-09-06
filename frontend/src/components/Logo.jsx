export default function Logo({ className = "w-9 h-9", plain = false }) {
  if (plain) {
    return (
      <img
        src="/assets/ggshlogo-transparent.png"
        alt="GGSH logo"
        className={`${className} object-contain shrink-0`}
      />
    );
  }
  return (
    <div className={`${className} rounded-xl bg-white ring-1 ring-black/5 p-0.5 flex items-center justify-center shrink-0`}>
      <img
        src="/assets/ggshlogo-transparent.png"
        alt="GGSH logo"
        className="w-full h-full object-contain"
      />
    </div>
  );
}
