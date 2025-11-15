"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Icon from "@/components/icon";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
  onUpgrade?: () => void;
}

export default function UpgradeModal({
  open,
  onClose,
  feature = "this feature",
  onUpgrade,
}: UpgradeModalProps) {
  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      // Default behavior: navigate to pricing page
      window.location.href = "/pricing";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-violet to-pink">
            <Icon name="Crown" className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-center">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-center">
            You&apos;ve reached your limit for {feature}. Upgrade to Premium for
            unlimited access and more features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Check" className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Unlimited resume uploads</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Check" className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Unlimited AI analyses</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Check" className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Unlimited job matches</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Check" className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">Priority support</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleUpgrade} size="lg" className="w-full">
            <Icon name="Crown" className="mr-2 h-4 w-4" />
            Upgrade Now
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="lg"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
