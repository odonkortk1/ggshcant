export default function Logo({ className = "w-9 h-9", plain = false }) {
  if (plain) {
    return (
      <img
        src="/assets/ggsh%20logo.png"
        alt="GGSH logo"
        className={`${className} object-contain shrink-0`}
      />
    );
  }
  return (
    <div className={`${className} rounded-xl overflow-hidden bg-white ring-1 ring-black/5 flex items-center justify-center shrink-0`}>
      <img
        src="/assets/ggsh%20logo.png"
        alt="GGSH logo"
        className="w-full h-full object-cover"
      />
    </div>
  );
}
