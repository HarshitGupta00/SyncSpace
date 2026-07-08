// components/ui/StatCard.jsx
import { TrendingUp } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, trend, trendLabel }) => (
  <div className="card flex flex-col gap-2">
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 bg-app rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={18} className="text-secondary" />
      </div>
      <span className="text-sm text-secondary font-medium">{label}</span>
    </div>
    <p className="text-4xl font-bold text-primary tracking-tight">{value}</p>
    {trendLabel && (
      <p className="text-xs text-secondary flex items-center gap-1">
        <TrendingUp size={11} className="text-status-green" />
        {trendLabel}
      </p>
    )}
  </div>
);

export default StatCard;
