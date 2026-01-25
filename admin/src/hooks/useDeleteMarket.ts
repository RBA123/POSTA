import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { deleteMarket, type DeleteMarketData } from "../services/markets";

export function useDeleteMarket() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: DeleteMarketData) => deleteMarket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      navigate("/markets");
    },
  });
}
