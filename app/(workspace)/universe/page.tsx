import { BubbleGraph } from "@/components/bubbles/bubble-graph";
import {
  getBubblesForCurrentUser,
  getRelationshipsForCurrentUser,
} from "@/lib/db/bubbles";

export default async function UniversePage() {
  const [bubbles, relationships] = await Promise.all([
    getBubblesForCurrentUser(),
    getRelationshipsForCurrentUser(),
  ]);

  return (
    <div className="h-[calc(100vh-65px)]">
      <BubbleGraph bubbles={bubbles} relationships={relationships} />
    </div>
  );
}
