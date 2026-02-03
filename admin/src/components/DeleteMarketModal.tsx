import { useState } from "react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

interface DeleteMarketModalProps {
  marketId: string;
  marketQuestion: string;
  onClose: () => void;
  onConfirm: (marketId: string) => void;
}

export function DeleteMarketModal({
  marketId,
  marketQuestion,
  onClose,
  onConfirm,
}: DeleteMarketModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmed = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);
    try {
      await onConfirm(marketId);
      onClose();
    } catch (error) {
      setIsDeleting(false);
      // Error will be handled by the parent component
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Delete Market</h2>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete this market? This action cannot be undone.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="font-semibold text-red-900 mb-2">Market to delete:</p>
            <p className="text-red-800">{marketQuestion}</p>
          </div>

          <p className="text-sm text-gray-600 mb-2">
            Type <span className="font-bold text-red-600">DELETE</span> to confirm:
          </p>

          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="font-mono"
          />
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="flex-1"
          >
            {isDeleting ? "Deleting..." : "Delete Market"}
          </Button>
        </div>

        {!isConfirmed && confirmText.length > 0 && (
          <p className="text-sm text-red-600 mt-2 text-center">
            Please type "DELETE" exactly as shown
          </p>
        )}
      </div>
    </div>
  );
}
