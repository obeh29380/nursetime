import { Hono } from "hono";
import { feedings } from "./db";
import { layout, breastButtons, feedingItem, feedingEditForm, feedingsList } from "./views";

const app = new Hono();

// HTMX を静的ファイルとして配信
app.get("/htmx.min.js", (c) => {
  return new Response(Bun.file("./public/htmx.min.js"), {
    headers: { "Content-Type": "application/javascript" },
  });
});

// メインページ
app.get("/", (c) => {
  const items = feedings.list();
  const body = breastButtons() + `<div id="feedings-list">${feedingsList(items)}</div>`;
  return c.html(layout(body));
});

// 授乳記録作成
app.post("/feedings", async (c) => {
  const form = await c.req.formData();
  const started_at = form.get("started_at") as string | null;
  const ended_at = (form.get("ended_at") as string | null) || null;
  const memo = (form.get("memo") as string | null) || null;

  if (!started_at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(started_at)) {
    return c.text("開始時刻が不正です", 400);
  }
  if (ended_at && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ended_at)) {
    return c.text("終了時刻が不正です", 400);
  }

  const f = feedings.create(started_at, ended_at, memo);
  return c.html(feedingItem(f));
});

// 授乳記録取得（編集キャンセル用）
app.get("/feedings/:id", (c) => {
  const id = Number(c.req.param("id"));
  const f = feedings.get(id);
  if (!f) return c.text("Not found", 404);
  return c.html(feedingItem(f));
});

// 編集フォーム表示
app.get("/feedings/:id/edit", (c) => {
  const id = Number(c.req.param("id"));
  const f = feedings.get(id);
  if (!f) return c.text("Not found", 404);
  return c.html(feedingEditForm(f));
});

// 授乳記録更新
app.put("/feedings/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const form = await c.req.formData();
  const started_at = form.get("started_at") as string | null;
  const ended_at = (form.get("ended_at") as string | null) || null;
  const memo = (form.get("memo") as string | null) || null;

  if (!started_at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(started_at)) {
    return c.text("開始時刻が不正です", 400);
  }
  if (ended_at && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ended_at)) {
    return c.text("終了時刻が不正です", 400);
  }

  const f = feedings.update(id, started_at, ended_at, memo);
  if (!f) return c.text("Not found", 404);
  return c.html(feedingItem(f));
});

// 授乳記録削除
app.delete("/feedings/:id", (c) => {
  const id = Number(c.req.param("id"));
  feedings.delete(id);
  // outerHTML swap で要素を削除するため空レスポンスを返す
  return c.body(null, 200);
});

// 完了トグル
app.post("/feedings/:id/complete", (c) => {
  const id = Number(c.req.param("id"));
  const f = feedings.toggleComplete(id);
  if (!f) return c.text("Not found", 404);
  return c.html(feedingItem(f));
});

const port = Number(process.env.PORT ?? 3000);
console.log(`Nursetime running on http://localhost:${port}`);

export default { port, fetch: app.fetch };
