import { DashboardBoardCard } from "@/components/boards/DashboardBoardCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Board } from "@/types/evespace";

export function FriendsBoardsFeed({ boards }: { boards: Board[] }) {
  if (boards.length === 0) {
    return (
      <EmptyState
        title="No friends' boards yet."
        description="Follow people to see memory boards they share with followers."
      />
    );
  }

  return (
    <div className="grid gap-4">
      {boards.map((board) => (
        <DashboardBoardCard
          board={board}
          canEdit={false}
          key={board.id}
        />
      ))}
    </div>
  );
}
