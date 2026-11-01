import { Hono } from "hono";
import { feedings, diapers } from "./db";
import { layout, breastButtons, feedingItem, feedingEditForm, diaperItem, diaperEditForm, allRecords } from "./views";

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
  const diaperItems = diapers.list();
  const body = breastButtons() + `<div id="feedings-list">${allRecords(items, diaperItems)}</div>`;
  return c.html(layout(body));
});

// 授乳記録作成
app.post("/feedings", async (c) => {
  const form = await c.req.formData();
  const started_at = form.get("started_at") as string | null;
  const ended_at = (form.get("ended_at") as string | null) || null;
  const memo = (form.get("memo") as string | null) || null;
  const user = (form.get("user") as string | null) || null;
  const bottle_type = (form.get("bottle_type") as string | null) || null;
  const amount_ml = form.get("amount_ml") ? Number(form.get("amount_ml")) : null;

  if (!started_at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(started_at)) {
    return c.text("開始時刻が不正です", 400);
  }
  if (ended_at && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ended_at)) {
    return c.text("終了時刻が不正です", 400);
  }

  const f = feedings.create(started_at, ended_at, memo, user, bottle_type, amount_ml);
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
  const bottle_type = (form.get("bottle_type") as string | null) || null;
  const amount_ml = form.get("amount_ml") ? Number(form.get("amount_ml")) : null;

  if (!started_at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(started_at)) {
    return c.text("開始時刻が不正です", 400);
  }
  if (ended_at && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(ended_at)) {
    return c.text("終了時刻が不正です", 400);
  }

  const f = feedings.update(id, started_at, ended_at, memo, bottle_type, amount_ml);
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
// おむつ替え記録作成
app.post("/diapers", async (c) => {
  const form = await c.req.formData();
  const changed_at = form.get("changed_at") as string | null;
  const type = form.get("type") as string | null;
  if (!changed_at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(changed_at)) {
    return c.text("\u6642\u523b\u304c\u4e0d\u6b63\u3067\u3059", 400);
  }
  const allowed = ["\u3046\u3093\u3061", "\u304a\u3057\u3063\u3053", "\u4e21\u65b9"];
  if (!type || !allowed.includes(type)) return c.text("\u7a2e\u985e\u304c\u4e0d\u6b63\u3067\u3059", 400);
  const user = (form.get("user") as string | null) || null;
  const d = diapers.create(changed_at, type, user);
  return c.html(diaperItem(d));
});

// おむつ替え記録取得（編集キャンセル用）
app.get("/diapers/:id", (c) => {
  const id = Number(c.req.param("id"));
  const d = diapers.get(id);
  if (!d) return c.text("Not found", 404);
  return c.html(diaperItem(d));
});

// おむつ替え編集フォーム
app.get("/diapers/:id/edit", (c) => {
  const id = Number(c.req.param("id"));
  const d = diapers.get(id);
  if (!d) return c.text("Not found", 404);
  return c.html(diaperEditForm(d));
});

// おむつ替え記録更新
app.put("/diapers/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const form = await c.req.formData();
  const changed_at = form.get("changed_at") as string | null;
  const type = form.get("type") as string | null;
  if (!changed_at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(changed_at)) {
    return c.text("\u6642\u523b\u304c\u4e0d\u6b63\u3067\u3059", 400);
  }
  const allowed = ["\u3046\u3093\u3061", "\u304a\u3057\u3063\u3053", "\u4e21\u65b9"];
  if (!type || !allowed.includes(type)) return c.text("\u7a2e\u985e\u304c\u4e0d\u6b63\u3067\u3059", 400);
  const d = diapers.update(id, changed_at, type);
  if (!d) return c.text("Not found", 404);
  return c.html(diaperItem(d));
});

// おむつ替え記録削除
app.delete("/diapers/:id", (c) => {
  const id = Number(c.req.param("id"));
  diapers.delete(id);
  return c.body(null, 200);
});
const port = Number(process.env.PORT ?? 3000);
console.log(`Nursetime running on http://localhost:${port}`);

export default { port, fetch: app.fetch };
