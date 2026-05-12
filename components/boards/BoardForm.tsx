import { BoardBackgroundPicker } from "@/components/boards/BoardBackgroundPicker";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import type { Board } from "@/types/evespace";

export function BoardForm({
  board,
  action,
}: {
  board?: Board | null;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card>
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

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Start date/time">
            <Input
              name="startTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(board?.startTime)}
            />
          </Field>
          <Field label="End date/time">
            <Input
              name="endTime"
              type="datetime-local"
              defaultValue={toDateTimeLocal(board?.endTime)}
            />
          </Field>
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

        <BoardBackgroundPicker defaultValue={board?.boardBackgroundTheme ?? "soft_cream"} />

        <Button type="submit">{board ? "Save" : "Create"}</Button>
      </form>
    </Card>
  );
}

function toDateTimeLocal(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 16);
}
