import { Check, Circle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusStepperProps {
  status: string;
}

const OrderStatusStepper = ({ status }: OrderStatusStepperProps) => {
  const steps = [
    { key: "requested", label: "요청" },
    { key: "accepted", label: "수락됨" },
    { key: "confirmed", label: "확정됨" },
    { key: "completed", label: "완료" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "requested":
        return 0;
      case "accepted":
        return 1;
      case "confirmed":
        return 2;
      case "completed":
      case "settled":
        return 3;
      case "cancelled":
        return -1; // Special case for cancelled
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isCancelled = status === "cancelled";

  return (
    <div className="flex items-center justify-between w-full py-2">
      {steps.map((step, index) => {
        const isCompleted = currentIndex > index;
        const isCurrent = currentIndex === index;
        const isUpcoming = currentIndex < index;

        // For cancelled status, show cancelled at step 1 (after requested)
        const showCancelled = isCancelled && index === 1;

        return (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                  showCancelled && "bg-red-500 text-white",
                  isCompleted && !showCancelled && "bg-green-500 text-white",
                  isCurrent && !showCancelled && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                  isUpcoming && !showCancelled && "bg-muted text-muted-foreground",
                  isCancelled && index > 1 && "bg-muted text-muted-foreground opacity-50"
                )}
              >
                {showCancelled ? (
                  <X className="h-4 w-4" />
                ) : isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" fill={isCurrent ? "currentColor" : "none"} />
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 whitespace-nowrap",
                  showCancelled && "text-red-500 font-medium",
                  isCompleted && !showCancelled && "text-green-600 dark:text-green-400 font-medium",
                  isCurrent && !showCancelled && "text-primary font-medium",
                  isUpcoming && !showCancelled && "text-muted-foreground",
                  isCancelled && index > 1 && "text-muted-foreground opacity-50"
                )}
              >
                {showCancelled ? "거절됨" : step.label}
              </span>
            </div>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-2",
                  isCompleted && !isCancelled && "bg-green-500",
                  isCurrent && !isCancelled && "bg-gradient-to-r from-primary to-muted",
                  (isUpcoming || isCancelled) && "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OrderStatusStepper;
