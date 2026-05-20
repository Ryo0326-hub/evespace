import { BoardBackgroundPicker } from "@/components/boards/BoardBackgroundPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { DEFAULT_BOARD_THEME } from "@/lib/board-themes";
import type { Board } from "@/types/evespace";

export function BoardForm({
  board,
  action,
}: {
  board?: Board | null;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card className="memory-board-form rounded-[2rem] border-[3px] border-black bg-[#fffaf0]/95 p-5 text-black shadow-[8px_8px_0_rgba(5,5,5,0.14)] backdrop-blur-0 sm:p-7">
      <form action={action} className="grid gap-5">
        {board ? <input name="boardId" type="hidden" value={board.id} /> : null}
        <input name="slug" type="hidden" value={board?.slug ?? ""} />
        <Field label="Board title *">
          <Input name="title" required defaultValue={board?.title ?? ""} />
        </Field>

        <Field label="short description">
          <Textarea
            name="description"
            rows={2}
            defaultValue={board?.description ?? ""}
            placeholder="Optional"
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)_minmax(0,1fr)_minmax(0,0.75fr)]">
          <Field label="Start date">
            <Input
              name="startDate"
              type="date"
              defaultValue={toDateValue(board?.startTime)}
            />
          </Field>
          <Field label="Add start time">
            <Input
              name="startTimeOfDay"
              type="time"
              defaultValue={toTimeValue(board?.startTime)}
              placeholder="Optional"
            />
          </Field>
          <Field label="End date">
            <Input
              name="endDate"
              type="date"
              defaultValue={toDateValue(board?.endTime)}
            />
          </Field>
          <Field label="Add end time">
            <Input
              name="endTimeOfDay"
              type="time"
              defaultValue={toTimeValue(board?.endTime)}
              placeholder="Optional"
            />
          </Field>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="location">
            <Input
              name="locationName"
              defaultValue={board?.locationName ?? ""}
              placeholder="Optional"
            />
          </Field>
        </div>

        <Field label="Sharing scope">
          <Select name="sharingScope" defaultValue={board?.sharingScope ?? "owner_only"}>
            <option value="owner_only">Owner only</option>
            <option value="followers">Followers only</option>
            <option value="public">Public</option>
          </Select>
        </Field>

        <BoardBackgroundPicker defaultValue={board?.boardBackgroundTheme ?? DEFAULT_BOARD_THEME} />

        <Button className="memory-board-cute-button w-full sm:w-auto" type="submit">
          {board ? "Save" : "Create"}
        </Button>
      </form>
    </Card>
  );
}

function toDateValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function toTimeValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const time = value.slice(11, 16);
  return time === "00:00" ? "" : time;
}
