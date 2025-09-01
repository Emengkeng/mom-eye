import { getCreditCost, TransformationType } from "@/constants";
import { Badge } from "@/components/ui/badge";

interface TransformationCostBadgeProps {
  type: TransformationType;
  action: 'Add' | 'Update';
  userBalance: number;
  className?: string;
}

export const TransformationCostBadge = ({
  type,
  action,
  userBalance,
  className = ""
}: TransformationCostBadgeProps) => {
  const transformationCost = Math.abs(getCreditCost(type));
  const uploadCost = Math.abs(getCreditCost('upload'));
  const totalCost = action === 'Add' ? transformationCost + uploadCost : transformationCost;
  
  const canAfford = userBalance >= totalCost;
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <Badge 
        variant={canAfford ? "default" : "destructive"}
        className="text-sm font-medium"
      >
        {totalCost} credits
      </Badge>
      {action === 'Add' && (
        <span className="text-xs text-gray-600">
          (Upload: {uploadCost} + Transform: {transformationCost})
        </span>
      )}
      {!canAfford && (
        <span className="text-xs text-red-600 font-medium">
          Insufficient credits
        </span>
      )}
    </div>
  );
};