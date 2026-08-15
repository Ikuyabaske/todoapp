"use client";

import { useState } from "react";
import { TaskListRow } from "./TaskListRow";
import type { TaskListItemData } from "./TaskListItem";

/**
 * タスク一覧画面のヘッダー（見出し＋右上の編集ボタン）と一覧本体。
 * 編集ボタンを押すと、各行の操作が「完了・後で」から「編集・削除」に切り替わる。
 */
export function TaskListView({ tasks }: { tasks: TaskListItemData[] }): JSX.Element {
  const [editMode, setEditMode] = useState(false);

  return (
    <>
      <div className="list-header">
        <h1>タスク一覧</h1>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setEditMode((v) => !v)}
        >
          {editMode ? "完了" : "編集"}
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="muted">登録されているタスクはまだありません。</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskListRow task={task} editMode={editMode} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
