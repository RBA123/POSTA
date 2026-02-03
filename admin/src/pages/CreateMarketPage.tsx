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
  
  // Helper to get current local datetime in the format datetime-local expects
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    // Subtract timezone offset to get local time
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<MarketFormData>({
    defaultValues: {
      // Get current time in user's local timezone for datetime-local input
      openAt: getCurrentLocalDateTime(),
      isUrgent: false,
      category: "en_vivo",
    },
  });

  const category = watch("category");
  const isUrgent = watch("isUrgent");
  const openAtValue = watch("openAt");
  const lockAtValue = watch("lockAt");

  // Helper to show if market will open immediately
  const willOpenImmediately = openAtValue 
    ? new Date(openAtValue).getTime() <= Date.now()
    : true;

  // Calculate event duration
  const getEventDuration = () => {
    if (!openAtValue || !lockAtValue) {
      return null;
    }

    const openTime = new Date(openAtValue).getTime();
    const lockTime = new Date(lockAtValue).getTime();
    const durationMs = lockTime - openTime;

    if (durationMs <= 0) {
      return null; // Invalid duration (closing before opening)
    }

    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    const parts: string[] = [];
    if (days > 0) {
      parts.push(`${days} day${days > 1 ? 's' : ''}`);
    }
    if (remainingHours > 0) {
      parts.push(`${remainingHours} hour${remainingHours > 1 ? 's' : ''}`);
    }
    if (minutes > 0) {
      parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    }

    return parts.length > 0 ? parts.join(', ') : '0 minutes';
  };

  const eventDuration = getEventDuration();

  // Helper to adjust lockAt time relative to current lockAt value (or now if not set)
  const adjustLockAtTime = (minutes: number) => {
    // Get current lockAt value or use now as base
    const baseTime = lockAtValue 
      ? new Date(lockAtValue)
      : new Date();
    
    // Adjust the time by adding/subtracting minutes
    const adjustedTime = new Date(baseTime.getTime() + minutes * 60 * 1000);
    
    // Convert to datetime-local format (local time, not UTC)
    const offset = adjustedTime.getTimezoneOffset() * 60000;
    const localTime = new Date(adjustedTime.getTime() - offset);
    const formattedTime = localTime.toISOString().slice(0, 16);
    
    setValue("lockAt", formattedTime);
  };

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
          <CardTitle>Create New Market</CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {(error as Error).message}
            </div>
          )}

          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
              Market Question <span className="text-red-500">*</span>
            </label>
            <Input
              id="question"
              {...register("question", { required: "Question is required" })}
              placeholder="Will Argentina win the match?"
            />
            {errors.question && (
              <p className="mt-1 text-sm text-red-600">{errors.question.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Additional market description..."
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              {...register("category", { required: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="en_vivo">⚡ LIVE</option>
              <option value="partidos">⚽ Matches</option>
              <option value="torneos">🏆 Tournaments</option>
              <option value="fase_grupos">👥 Group Stage</option>
              <option value="jugadores">👤 Players</option>
            </select>
          </div>

          <div>
            <label htmlFor="openAt" className="block text-sm font-medium text-gray-700 mb-1">
              Opening Date & Time <span className="text-red-500">*</span>
            </label>
            <Input
              id="openAt"
              type="datetime-local"
              {...register("openAt", { required: true })}
            />
            <div className="mt-1 text-sm">
              {willOpenImmediately ? (
                <p className="text-green-600 font-medium">
                  ✅ Market will open immediately
                </p>
              ) : (
                <p className="text-amber-600 font-medium">
                  ⏳ Market will be in "draft" status until this time
                </p>
              )}
              <p className="text-gray-500 mt-1">
                Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
          </div>

          {(category === "en_vivo" || isUrgent) && (
            <div>
              <label htmlFor="lockAt" className="block text-sm font-medium text-gray-700 mb-1">
                Closing Date & Time (optional)
              </label>
              <Input
                id="lockAt"
                type="datetime-local"
                {...register("lockAt")}
              />
              <div className="mt-1 text-sm mb-2">
                <p className="text-gray-500">
                  The market will close automatically at this time
                </p>
                {eventDuration && (
                  <p className="text-blue-600 font-medium mt-1">
                    ⏱️ Event duration: {eventDuration}
                  </p>
                )}
                {lockAtValue && openAtValue && !eventDuration && (
                  <p className="text-red-600 font-medium mt-1">
                    ⚠️ Closing time must be after opening time
                  </p>
                )}
              </div>
              
              {/* Time adjustment buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(-1)}
                  className="text-xs border border-gray-300"
                >
                  -1 min
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(1)}
                  className="text-xs border border-gray-300"
                >
                  +1 min
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(-30)}
                  className="text-xs border border-gray-300"
                >
                  -30 min
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(30)}
                  className="text-xs border border-gray-300"
                >
                  +30 min
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(-60)}
                  className="text-xs border border-gray-300"
                >
                  -1 hour
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(60)}
                  className="text-xs border border-gray-300"
                >
                  +1 hour
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(-24 * 60)}
                  className="text-xs border border-gray-300"
                >
                  -1 day
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => adjustLockAtTime(24 * 60)}
                  className="text-xs border border-gray-300"
                >
                  +1 day
                </Button>
              </div>
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
              Urgent market (LIVE)
            </label>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tags (optional, comma-separated)
            </label>
            <Input
              id="tags"
              {...register("tags")}
              placeholder="argentina, copa-america, final"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL (optional)
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
              {isPending ? "Creating..." : "Create Market"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
