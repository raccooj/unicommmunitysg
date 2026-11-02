import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

const db = new PGlite();
const migration = readFileSync(process.argv[2], "utf8");
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
await db.exec(migration);
await db.exec(migration); // repeatable

const A = "00000000-0000-0000-0000-00000000000a"; // NUS
const B = "00000000-0000-0000-0000-00000000000b"; // NUS
const C = "00000000-0000-0000-0000-00000000000c"; // NTU
const N = "00000000-0000-0000-0000-00000000000d"; // no university
await db.exec(`insert into auth.users values ('${A}','a@x.sg'),('${B}','b@x.sg'),('${C}','c@x.sg'),('${N}','n@x.sg')`);

let pass = 0, fail = 0;
async function as(uid, sql) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid}', false); set role authenticated;`);
  try { return { rows: (await db.query(sql)).rows }; } catch (e) { return { error: e.message }; }
}
function check(name, ok, detail) {
  if (ok) pass++; else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + JSON.stringify(detail)}`);
}

let r;
r = await as(A, `select id, university from profiles`);
check("profile auto-created, user sees only own", r.rows?.length === 1 && r.rows[0].id === A, r);
r = await as(A, `update profiles set university='NUS' where id='${A}'`); check("A selects NUS", !r.error, r);
r = await as(B, `update profiles set university='NUS' where id='${B}'`); check("B selects NUS", !r.error, r);
r = await as(C, `update profiles set university='NTU' where id='${C}'`); check("C selects NTU", !r.error, r);
r = await as(A, `update profiles set university='XYZ' where id='${A}'`); check("invalid university rejected", !!r.error, r);
r = await as(A, `update profiles set university='NTU' where id='${A}'`); check("university locked after selection", !!r.error, r);
r = await as(A, `update profiles set university='NUS' where id='${N}' returning id`); check("cannot update another profile", !r.error && r.rows.length === 0, r);
r = await as(A, `select university from profiles where id='${B}'`); check("cannot read another profile", r.rows?.length === 0, r);

r = await as(N, `insert into posts (category,title,body) values ('general','t','b')`); check("no-university user cannot post", !!r.error, r);
r = await as(A, `insert into posts (category,title,body) values ('academics','CS2040 tips','Any advice?') returning id, university`);
check("A creates post in NUS", r.rows?.[0]?.university === "NUS", r);
const postA = r.rows?.[0]?.id;
r = await as(A, `insert into posts (category,title,body,university) values ('general','x','y','NTU')`); check("cannot pass university column", !!r.error, r);
r = await as(A, `insert into posts (category,title,body,author_id) values ('general','x','y','${B}')`); check("cannot impersonate author on post", !!r.error, r);
r = await as(A, `insert into posts (category,title,body) values ('memes','x','y')`); check("invalid category rejected", !!r.error, r);
r = await as(A, `insert into posts (category,title,body) values ('general','   ','y')`); check("blank title rejected", !!r.error, r);
r = await as(A, `select author_id from posts`); check("author_id not readable", !!r.error, r);
r = await as(A, `select * from comments`); check("select * blocked (hidden columns)", !!r.error, r);

r = await as(B, `select id, title from posts`); check("B (same uni) reads post", r.rows?.length === 1, r);
r = await as(C, `select id, title from posts`); check("C (other uni) cannot read post", r.rows?.length === 0, r);
r = await as(N, `select id, title from posts`); check("no-university user reads nothing", r.rows?.length === 0, r);

r = await as(B, `insert into comments (post_id, body) values ('${postA}','Practice past papers') returning id, is_op`);
check("B comments on A's post", r.rows?.[0]?.is_op === false, r);
const commentB = r.rows?.[0]?.id;
r = await as(A, `insert into comments (post_id, body) values ('${postA}','Thanks!') returning is_op`); check("A comment marked OP", r.rows?.[0]?.is_op === true, r);
r = await as(C, `insert into comments (post_id, body) values ('${postA}','hi')`); check("C cannot comment on NUS post", !!r.error, r);
r = await as(B, `insert into comments (post_id, body, author_id) values ('${postA}','x','${A}')`); check("cannot impersonate comment author", !!r.error, r);
r = await as(C, `select id from comments`); check("C cannot read NUS comments", r.rows?.length === 0, r);
r = await as(B, `select id, body, is_op from comments where post_id='${postA}'`); check("B reads both comments", r.rows?.length === 2, r);
r = await as(B, `select comment_count from posts where id='${postA}'`); check("comment_count = 2", r.rows?.[0]?.comment_count === 2, r);

r = await as(B, `update posts set title='hacked' where id='${postA}' returning id`); check("B cannot edit A's post", !r.error && r.rows.length === 0, r);
r = await as(B, `delete from posts where id='${postA}' returning id`); check("B cannot delete A's post", !r.error && r.rows.length === 0, r);
r = await as(A, `update comments set body='edited' where id='${commentB}' returning id`); check("A cannot edit B's comment", !r.error && r.rows.length === 0, r);
r = await as(A, `delete from comments where id='${commentB}' returning id`); check("A cannot delete B's comment", !r.error && r.rows.length === 0, r);
r = await as(A, `update posts set comment_count=999 where id='${postA}'`); check("cannot tamper comment_count", !!r.error, r);
r = await as(C, `update posts set title='x' where id='${postA}' returning id`); check("C cannot edit NUS post", !r.error && r.rows.length === 0, r);
r = await as(B, `delete from comments where id='${commentB}' returning id`); check("B deletes own comment", r.rows?.length === 1, r);
r = await as(A, `update posts set title='CS2040 study tips' where id='${postA}' returning id`); check("A edits own post", r.rows?.length === 1, r);

await db.exec(`reset role; select set_config('request.jwt.claim.sub', '', false); set role anon;`);
try { await db.query(`select id from posts`); check("anon blocked", false, "readable"); } catch { check("anon blocked", true); }
r = await as(A, `select current_university()`); check("current_university callable", r.rows?.[0]?.current_university === "NUS", r);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
