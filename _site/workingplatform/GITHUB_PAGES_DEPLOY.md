# GitHub Pages 部署说明

这个项目可以直接部署到 GitHub Pages，不需要 Node 运行环境。

## 1. 上传到 GitHub

把项目根目录里的这些文件提交到仓库：

- `index.html`
- `app.js`
- `styles.css`
- `data/schedules.js`
- `data/bookmarks.js`
- `头像.jpg`
- `.nojekyll`

不要提交 `data/schedules.local.js`。这个文件只用于本地私有初始日程，已经被 `.gitignore` 忽略；公开访客默认会从空的 `data/schedules.js` 开始，并把后续修改保存在自己的浏览器 `localStorage` 里。

本地启动脚本可以提交，也可以不提交：

- `server.js`
- `start-local.cmd`
- `启动动量工作空间.cmd`

## 2. 开启 GitHub Pages

进入 GitHub 仓库：

1. 打开 `Settings`
2. 进入 `Pages`
3. `Build and deployment` 选择 `Deploy from a branch`
4. Branch 选择 `main`
5. Folder 选择 `/root`
6. 点击 `Save`

部署后网址通常是：

```text
https://你的用户名.github.io/仓库名/
```

## 3. 配置 Supabase 回调地址

进入 Supabase 项目：

`Authentication -> URL Configuration`

把 GitHub Pages 地址加入允许列表，例如本站当前建议使用：

```text
https://Lin-Donge.github.io/workingplatform/
```

如果以后使用仓库子路径形式，也加入对应地址：

```text
https://你的用户名.github.io/仓库名/
```

如果仍然本地开发，也保留：

```text
http://localhost:5173
```

同时确认 `Authentication -> Providers -> Email` 已启用。注册、忘记密码和修改密码邮件都会跳回上面的地址。

## 4. 配置 Supabase 数据表

云端同步会读写 `workspaces` 表，字段和权限可用下面的 SQL 创建：

```sql
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.workspaces enable row level security;

create policy "Users can read their own workspaces"
on public.workspaces
for select
using (auth.uid() = user_id);

create policy "Users can insert their own workspaces"
on public.workspaces
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own workspaces"
on public.workspaces
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own workspaces"
on public.workspaces
for delete
using (auth.uid() = user_id);
```

`app.js` 中的 Supabase publishable key 可以放在前端；真正的安全边界是 RLS 策略，不要在前端放 service role key。

## 5. 使用方式

部署后直接访问 GitHub Pages 地址即可。

本地版本仍然可以双击：

```text
启动动量工作空间.cmd
```
