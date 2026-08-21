"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { TaskListRow } from "./TaskListRow";
import type { TaskListItemData } from "./TaskListItem";

export interface TaskListCategory {
  id: string;
  name: string;
}

// タブ選択はページ遷移のたびにコンポーネントが作り直されて消えるため、
// タブに戻ってきたときに直前の選択を復元できるようsessionStorageに保存する。
const ACTIVE_TAB_STORAGE_KEY = "upkeep:tasks:activeCategoryTab";

// 「編集」ボタンを長押しすると、他画面から戻ってきても編集モードのままになる。
// 通常タップは今まで通りその場限りの切り替えとし、sessionStorageには保存しない。
const PINNED_EDIT_MODE_STORAGE_KEY = "upkeep:tasks:pinnedEditMode";
const LONG_PRESS_MS = 2000;

/**
 * タスク一覧画面のヘッダー（見出し＋右上の編集ボタン）と一覧本体。
 * 編集ボタンを押すと、各行の操作が「完了・後で」から「編集・削除」に切り替わる。
 * カテゴリタブで「ビジネス」「勉強」「家のこと」のような大分類ごとに絞り込める。
 */
export function TaskListView({
  tasks,
  categories,
}: {
  tasks: TaskListItemData[];
  categories: TaskListCategory[];
}): JSX.Element {
  const [editMode, setEditMode] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  // マウント後にsessionStorageから前回選択していたタブ・固定編集モードを復元する
  // （サーバー側レンダリングとの不一致を避けるため、初期値はfalse/nullにしてeffectで反映する）。
  useEffect(() => {
    const storedTab = sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
    if (storedTab) setActiveCategoryId(storedTab);
    if (sessionStorage.getItem(PINNED_EDIT_MODE_STORAGE_KEY) === "1") {
      setEditMode(true);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  function selectCategory(id: string | null): void {
    setActiveCategoryId(id);
    if (id === null) {
      sessionStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
    } else {
      sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, id);
    }
  }

  function handleEditPointerDown(): void {
    longPressFired.current = false;
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setEditMode((prev) => {
        const next = !prev;
        if (next) {
          sessionStorage.setItem(PINNED_EDIT_MODE_STORAGE_KEY, "1");
        } else {
          sessionStorage.removeItem(PINNED_EDIT_MODE_STORAGE_KEY);
        }
        return next;
      });
    }, LONG_PRESS_MS);
  }

  function handleEditPointerUp(): void {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleEditClick(): void {
    // 長押しで既に切り替え済みの場合、その直後に発火するclickでの二重切り替えを防ぐ。
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    setEditMode((v) => !v);
  }

  // タスクが実際に紐づいているカテゴリのみタブに出す（未使用カテゴリでタブが埋まるのを防ぐ）。
  const usedCategories = useMemo(
    () => categories.filter((c) => tasks.some((t) => t.category?.id === c.id)),
    [categories, tasks]
  );
  const hasUncategorized = useMemo(() => tasks.some((t) => !t.category), [tasks]);

  const visibleTasks = useMemo(() => {
    if (activeCategoryId === null) return tasks;
    if (activeCategoryId === UNCATEGORIZED) return tasks.filter((t) => !t.category);
    return tasks.filter((t) => t.category?.id === activeCategoryId);
  }, [tasks, activeCategoryId]);

  return (
    <>
      <div className="list-header">
        <h1>タスク一覧</h1>
        <div className="list-header-actions">
          <Link className="btn btn-sm btn-primary" href="/tasks/new">
            + タスク登録
          </Link>
          <Link className="btn btn-sm" href="/tasks/history">
            履歴
          </Link>
          <button
            type="button"
            className={`btn btn-sm${editMode ? " btn-primary" : ""}`}
            onClick={handleEditClick}
            onPointerDown={handleEditPointerDown}
            onPointerUp={handleEditPointerUp}
            onPointerLeave={handleEditPointerUp}
            onPointerCancel={handleEditPointerUp}
            onContextMenu={(e) => e.preventDefault()}
          >
            {editMode ? "完了" : "編集"}
          </button>
        </div>
      </div>

      {(usedCategories.length > 0 || hasUncategorized) && (
        <div className="category-tabs">
          <button
            type="button"
            className={`category-tab${activeCategoryId === null ? " active" : ""}`}
            onClick={() => selectCategory(null)}
          >
            すべて
          </button>
          {usedCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`category-tab${activeCategoryId === c.id ? " active" : ""}`}
              onClick={() => selectCategory(c.id)}
            >
              {c.name}
            </button>
          ))}
          {hasUncategorized && (
            <button
              type="button"
              className={`category-tab${activeCategoryId === UNCATEGORIZED ? " active" : ""}`}
              onClick={() => selectCategory(UNCATEGORIZED)}
            >
              未分類
            </button>
          )}
        </div>
      )}

      {visibleTasks.length === 0 ? (
        <p className="muted">
          {tasks.length === 0
            ? "登録されているタスクはまだありません。"
            : "このカテゴリのタスクはありません。"}
        </p>
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => (
            <li key={task.id}>
              <TaskListRow task={task} editMode={editMode} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const UNCATEGORIZED = "__uncategorized__";
