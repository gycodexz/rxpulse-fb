export default function Logo({ size = 36, showText = true }) {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/logo.png" alt="RxPulse" style={{ width: size, height: size }} className="rounded-lg object-contain" />
      {showText && (
        <span className="text-lg font-bold tracking-tight text-brand-700 dark:text-brand-200">
          Rx<span className="text-brand-500 dark:text-accent">Pulse</span>
        </span>
      )}
    </div>
  )
}
