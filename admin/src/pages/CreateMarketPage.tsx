import { useForm } from "react-hook-form";
import { useCreateMarket } from "../hooks/useCreateMarket";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { Card, CardHeader, CardTitle } from "../components/ui/Card";
import type { MarketCategory } from "../types";

interface MarketFormData {
  question: string;
  description?: string;
  category: MarketCategory;
  openAt: string;
  lockAt?: string;
  isUrgent: boolean;
  tags: string;
  imageUrl?: string;
}

export function CreateMarketPage() {
  const { mutate: createMarket, isPending, error } = useCreateMarket();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<MarketFormData>({
    defaultValues: {
      openAt: new Date().toISOString().slice(0, 16),
      isUrgent: false,
      category: "en_vivo",
    },
  });

  const category = watch("category");
  const isUrgent = watch("isUrgent");

  const onSubmit = (data: MarketFormData) => {
    const tagsArray = data.tags
      ? data.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

    createMarket({
      question: data.question,
      description: data.description || undefined,
      category: data.category,
      openAt: data.openAt ? new Date(data.openAt).toISOString() : undefined,
      lockAt: data.lockAt ? new Date(data.lockAt).toISOString() : undefined,
      isUrgent: data.isUrgent,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      imageUrl: data.imageUrl || undefined,
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Mercado</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {(error as Error).message}
            </div>
          )}

          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              Pregunta del Mercado <span className="text-red-500">*</span>
            </label>
            <Input
              id="question"
              {...register("question", { required: "La pregunta es requerida" })}
              placeholder="¿Ganará Argentina el partido?"
            />
            {errors.question && (
              <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Descripción adicional del mercado..."
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              {...register("category", { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="en_vivo">⚡ EN VIVO</option>
              <option value="partidos">⚽ Partidos</option>
              <option value="torneos">🏆 Torneos</option>
              <option value="fase_grupos">👥 Fase de Grupos</option>
              <option value="jugadores">👤 Jugadores</option>
            </select>
          </div>

          <div>
            <label htmlFor="openAt" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha y Hora de Apertura <span className="text-red-500">*</span>
            </label>
            <Input
              id="openAt"
              type="datetime-local"
              {...register("openAt", { required: true })}
            />
            <p className="mt-1 text-sm text-gray-500">
              Si es en el pasado o ahora, el mercado se abrirá automáticamente
            </p>
          </div>

          {(category === "en_vivo" || isUrgent) && (
            <div>
              <label htmlFor="lockAt" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha y Hora de Cierre (opcional)
              </label>
              <Input
                id="lockAt"
                type="datetime-local"
                {...register("lockAt")}
              />
              <p className="mt-1 text-sm text-gray-500">
                El mercado se cerrará automáticamente a esta hora
              </p>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isUrgent"
              {...register("isUrgent")}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-700">
              Mercado urgente (EN VIVO)
            </label>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Etiquetas (opcional, separadas por comas)
            </label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="argentina, copa-america, final"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              URL de Imagen (opcional)
            </label>
            <Input
              id="imageUrl"
              type="url"
              {...register("imageUrl")}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Creando..." : "Crear Mercado"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.history.back()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
