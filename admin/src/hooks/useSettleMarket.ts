import { useMutation, useQueryClient } from "@tanstack/react-query";
import { settleMarket, type SettleMarketData } from "../services/markets";

export function useSettleMarket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SettleMarketData) => settleMarket(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["market", variables.marketId] });
    },
  });
}
