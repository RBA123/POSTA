import { useState } from "react";
import { Button } from "./ui/Button";
import { Card, CardHeader, CardTitle } from "./ui/Card";
import { useSettleMarket } from "../hooks/useSettleMarket";
import type { Market, MarketResult } from "../types";

interface SettlementModalProps {
  market: Market;
  onClose: () => void;
}

export function SettlementModal({ market, onClose }: SettlementModalProps) {
  const [selectedResult, setSelectedResult] = useState<MarketResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { mutate: settleMarket, isPending, error } = useSettleMarket();

  const handleSettle = () => {
    if (!selectedResult) return;
    
    if (!confirmed) {
      setConfirmed(true);
      return;
    }

    settleMarket(
      {
        marketId: market.id,
        result: selectedResult as MarketResult,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const canSettle = market.status === "open" || market.status === "locked";
  const isSettled = market.status === "settled";

  if (isSettled) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Market Already Settled</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              This market has already been settled with result:{" "}
              <span className="font-semibold">{market.result?.toUpperCase()}</span>
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!canSettle) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Cannot Settle</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Only open or locked markets can be settled.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Settle Market</CardTitle>
        </CardHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {(error as Error).message}
            </div>
          )}

          {!confirmed ? (
            <>
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Select the market result:
                </p>
                <div className="space-y-2">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="result"
                      value="si"
                      checked={selectedResult === "si"}
                      onChange={(e) => setSelectedResult(e.target.value as MarketResult)}
                      className="mr-3"
                    />
                    <span className="font-medium">Yes</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="result"
                      value="no"
                      checked={selectedResult === "no"}
                      onChange={(e) => setSelectedResult(e.target.value as MarketResult)}
                      className="mr-3"
                    />
                    <span className="font-medium">No</span>
                  </label>
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="result"
                      value="cancelled"
                      checked={selectedResult === "cancelled"}
                      onChange={(e) => setSelectedResult(e.target.value as MarketResult)}
                      className="mr-3"
                    />
                    <span className="font-medium">Cancelled (refund all bets)</span>
                  </label>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Market:</strong> {market.question}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Pending bets:</strong> {market.totalBets}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total volume:</strong> ${market.totalVolume.toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800 mb-2">
                Are you sure you want to settle this market?
              </p>
              <p className="text-sm text-yellow-700">
                Selected result: <strong>{selectedResult!.toUpperCase()}</strong>
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                This action will update all pending bets and user balances.
                This cannot be undone.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleSettle}
              disabled={!selectedResult || isPending}
              className="flex-1"
            >
              {isPending
                ? "Settling..."
                : confirmed
                ? "Confirm Settlement"
                : "Continue"}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
