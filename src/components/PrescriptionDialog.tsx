
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface PrescriptionDialogProps {
  medicineName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const PrescriptionDialog = ({
  medicineName,
  open,
  onOpenChange,
  onConfirm,
}: PrescriptionDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Prescription Required
          </DialogTitle>
          <DialogDescription>
            This medicine requires a prescription before it can be sold.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-gray-800 mb-2">
            <span className="font-medium">{medicineName}</span> requires a valid prescription.
          </p>
          <p className="text-gray-600 text-sm">
            Please ensure that you have checked the customer's prescription before proceeding with the sale.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Prescription Checked
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionDialog;
