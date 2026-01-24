import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createMarket, type CreateMarketData } from "../services/markets";

export function useCreateMarket() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: CreateMarketData) => createMarket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      navigate("/markets");
    },
  });
}
