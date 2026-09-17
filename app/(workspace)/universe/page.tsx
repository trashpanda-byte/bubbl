import { BubbleGraph } from "@/components/bubbles/bubble-graph";
import { ThoughtCapture } from "@/components/bubbles/thought-capture";
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
    <div className="relative h-[calc(100vh-65px)]">
      <ThoughtCapture />
      <BubbleGraph bubbles={bubbles} relationships={relationships} />
    </div>
  );
}
