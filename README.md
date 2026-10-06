# Focus Ledger — 个人计划与待办管理 MVP

一个不依赖框架、后端或构建工具的个人计划网站。任务保存在当前浏览器的 `localStorage` 中，刷新页面或关闭浏览器后仍会保留，可以直接部署到 GitHub Pages。

## 已实现功能

- Today、This Week、This Month、Long Term 四个计划范围
- Completed 已完成任务视图
- 新增、编辑、删除任务
- 完成任务与恢复为未完成
- 标题、描述、创建时间、截止日期、分类、完成状态、优先级
- 未完成与已完成数量统计、当前范围完成进度
- 按全部 / 待完成 / 已完成筛选
- 按最近创建 / 优先级 / 截止日期排序
- 使用 `localStorage` 持久保存数据
- 桌面端左侧导航，手机端底部导航
- 无第三方依赖，无构建步骤，可直接用于 GitHub Pages

## 项目结构

```text
.
├── index.html   # 页面结构、任务表单和导航
├── style.css    # 视觉样式、任务状态和响应式布局
├── app.js       # 数据读写、增删改查、筛选排序和界面交互
└── README.md    # 使用、部署和后续升级说明
```

`work/` 是开发验证过程使用的测试与设计记录，不影响网站运行，也不需要上传到 GitHub。如果希望远程仓库严格保持上面的四文件结构，只提交四个根目录文件即可。

## Task 数据结构

每个任务使用下面的数据结构：

```js
{
  id: "0a93...",                      // 唯一 ID
  title: "整理本周研究笔记",           // 标题
  description: "归纳三篇论文的结论",   // 描述，可为空
  category: "week",                   // today | week | month | long-term
  priority: "medium",                 // low | medium | high
  dueDate: "2026-10-12",              // YYYY-MM-DD，可为空
  completed: false,                    // 完成状态
  createdAt: "2026-10-06T08:30:00.000Z" // ISO 创建时间
}
```

浏览器存储键为：

```text
focus-ledger.tasks.v1
```

## 本地打开和运行

### 方法一：直接打开

双击 `index.html`，或将它拖入浏览器。项目没有模块导入、接口请求和构建产物，因此可通过 `file://` 直接工作。

如果浏览器的隐私设置禁止本地文件使用 `localStorage`，请使用下面的本地服务器方式。

### 方法二：启动本地静态服务器（推荐）

进入项目目录：

```bash
cd /home/ubuntu/Documents/Codex/2026-10-06/mvp-github-github-pages-1-html
python3 -m http.server 8000
```

然后打开：

```text
http://localhost:8000
```

停止服务器时，在终端按 `Ctrl + C`。

> 注意：`file://`、`http://localhost:8000` 和 GitHub Pages 网址是三个不同的浏览器来源，各自拥有独立的 `localStorage`。因此，本地测试任务不会自动出现在正式 GitHub Pages 网站中；这是第一版“暂不跨设备同步”的正常行为。

## 如何修改代码

- 修改页面文案或结构：编辑 `index.html`
- 修改颜色、间距、字体和手机布局：编辑 `style.css`
- 修改任务行为、筛选或存储：编辑 `app.js`

### 常用视觉变量

`style.css` 顶部的 `:root` 集中定义了主要颜色和尺寸：

```css
--paper: #f4f5f3;
--surface: #fbfcfa;
--ink: #1e252b;
--blue: #315f84;
--sidebar-width: 264px;
```

### 数据读写入口

`app.js` 中的数据操作已单独封装：

```js
loadTasks();
saveTasks(tasks);
addTask(taskData);
updateTask(taskId, changes);
deleteTask(taskId);
```

修改后刷新浏览器即可看到效果，不需要执行编译或构建命令。

## 创建 GitHub 仓库

1. 登录 [GitHub](https://github.com/)。
2. 点击右上角 `+` → `New repository`。
3. Repository name 可以填写 `focus-ledger`。
4. 选择 `Public`（GitHub Free 的 Pages 最直接）。
5. 不要勾选自动创建 README、`.gitignore` 或 License，因为本地已有文件。
6. 点击 `Create repository`。

也可以使用 GitHub CLI：

```bash
gh auth login
gh repo create focus-ledger --public --source=. --remote=origin
```

## 初始化 Git 并 push 到 GitHub

在项目目录执行：

```bash
git init
git branch -M main
git add index.html style.css app.js README.md
git commit -m "feat: create personal planner MVP"
git remote add origin https://github.com/YOUR_USERNAME/focus-ledger.git
git push -u origin main
```

把 `YOUR_USERNAME` 替换成你的 GitHub 用户名。

如果使用 SSH：

```bash
git remote add origin git@github.com:YOUR_USERNAME/focus-ledger.git
git push -u origin main
```

如果之前已经添加过 `origin`，不要重复执行 `git remote add`。可以先检查：

```bash
git remote -v
```

之后每次更新网站：

```bash
git add index.html style.css app.js README.md
git commit -m "update: improve planner"
git push
```

## 开启 GitHub Pages

1. 打开 GitHub 上的仓库。
2. 进入 `Settings` → 左侧 `Pages`。
3. 在 `Build and deployment` 的 `Source` 中选择 `Deploy from a branch`。
4. Branch 选择 `main`，目录选择 `/ (root)`。
5. 点击 `Save`。
6. 等待约 1–5 分钟，回到 Pages 页面查看发布状态和网址。

本项目全部使用相对路径：

```html
<link rel="stylesheet" href="style.css" />
<script src="app.js" defer></script>
```

因此放在 GitHub Pages 的项目子路径下也可以正常加载，不依赖电脑上的绝对路径。

## 最终网站 URL 格式

如果仓库名是 `focus-ledger`：

```text
https://YOUR_USERNAME.github.io/focus-ledger/
```

如果仓库名是 `YOUR_USERNAME.github.io`：

```text
https://YOUR_USERNAME.github.io/
```

手机和电脑都可以直接访问这个网址。当前版本的数据分别保存在每台设备、每个浏览器中，不会互相同步。

## 后续接入 Supabase 的建议

第一版不用改页面结构。升级时可把 `app.js` 中直接访问 `localStorage` 的逻辑替换为一个异步数据仓库：

```js
const taskRepository = {
  async loadTasks(userId) {
    // return await supabase.from("tasks").select("*").eq("user_id", userId);
  },
  async addTask(task) {
    // return await supabase.from("tasks").insert(task).select().single();
  },
  async updateTask(id, changes) {
    // return await supabase.from("tasks").update(changes).eq("id", id);
  },
  async deleteTask(id) {
    // return await supabase.from("tasks").delete().eq("id", id);
  }
};
```

推荐升级顺序：

1. 在 Supabase 创建项目。
2. 开启 Supabase Auth，支持邮箱或第三方登录。
3. 创建 `tasks` 表，字段与当前 Task 结构对应，并增加 `user_id`。
4. 开启 Row Level Security，确保用户只能访问自己的任务。
5. 将当前同步的 CRUD 函数改为调用 `taskRepository` 的异步函数。
6. 首次登录时提供一次“导入本地任务”，把现有 `localStorage` 数据写入 Supabase。
7. 云端写入成功后再更新界面；网络失败时保留清晰的错误提示。

建议的表结构：

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text default '',
  category text not null,
  priority text not null default 'medium',
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
```

Supabase 的公开 `anon key` 可以出现在纯前端代码中，但前提是正确配置 Row Level Security；绝不能把 `service_role key` 放进网页或 GitHub 仓库。

## 当前版本边界

- 没有用户账号和跨设备同步
- 没有提醒通知、循环任务、子任务或拖拽
- 清除浏览器站点数据会删除本机任务
- 不同浏览器、不同域名和隐私模式的数据彼此独立

这些限制是有意保留的，目的是让第一版保持可读、可维护，并优先跑通“本地开发 → GitHub → GitHub Pages → 多端访问”的完整流程。
