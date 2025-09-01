import { transformationTypes, TransformationType, getCreditCost } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CreditPricingDisplayProps {
  userBalance: number;
  className?: string;
}

export const CreditPricingDisplay = ({ 
  userBalance, 
  className = "" 
}: CreditPricingDisplayProps) => {
  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Credit Pricing Guide</span>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Balance: {userBalance} credits
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {Object.entries(transformationTypes).map(([key, transformation]) => {
            const cost = Math.abs(getCreditCost(key as TransformationType));
            const canAfford = userBalance >= cost;
            
            return (
              <div
                key={key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  canAfford 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    canAfford ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <span className="text-xs font-medium">
                      {canAfford ? '✓' : '✗'}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {transformation.title}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {transformation.subTitle}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={canAfford ? "default" : "destructive"}
                  className="font-medium"
                >
                  {cost} credits
                </Badge>
              </div>
            );
          })}
          
          {/* Upload cost */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xs font-medium">📤</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Image Upload</h4>
                <p className="text-sm text-gray-600">
                  Processing and storage fee
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="font-medium">
              {Math.abs(getCreditCost('upload'))} credit
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> New transformations include both upload and processing fees. 
            Updates only charge the transformation fee.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};