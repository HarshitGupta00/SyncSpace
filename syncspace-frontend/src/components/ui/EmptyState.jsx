// components/ui/EmptyState.jsx
import Button from "./Button";

const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
}) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {Icon && (
      <div className="w-14 h-14 bg-app rounded-2xl flex items-center justify-center mb-4 border border-border">
        <Icon size={24} className="text-tertiary" />
      </div>
    )}
    <h3 className="text-md font-semibold text-primary mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-secondary max-w-sm">{description}</p>
    )}
    {action && actionLabel && (
      <div className="mt-5">
        <Button onClick={action} size="sm">{actionLabel}</Button>
      </div>
    )}
  </div>
);

export default EmptyState;
