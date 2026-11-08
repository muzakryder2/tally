import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Show,
  SignUpButton,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/react";
import toast from "react-hot-toast";

const BASE_URL = "http://localhost:3000/api/lists";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m3.4 8.2 2.8 2.7 6.4-6.3" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M7 5h9M7 10h9M7 15h9" />
      <circle cx="3.5" cy="5" r=".75" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="10" r=".75" fill="currentColor" stroke="none" />
      <circle cx="3.5" cy="15" r=".75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 6h12M8 3.5h4M6 6l.7 10.5h6.6L14 6M8.5 9v4.5M11.5 9v4.5" />
    </svg>
  );
}

export const App = () => {
  const [lists, setLists] = useState([]);
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem("selectedId") ?? "",
  );
  const [newItem, setNewItem] = useState("");
  const [newList, setNewList] = useState("");
  const [isAddingList, setIsAddingList] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const authenticatedFetch = useCallback(
    async (url, options = {}) => {
      if (!isLoaded || !isSignedIn) {
        throw new Error("You must be signed in to make this request");
      }

      const token = await getToken();

      if (!token) {
        throw new Error("Unable to retrieve Clerk session token");
      }

      const headers = new Headers(options.headers);
      headers.set("Authorization", `Bearer ${token}`);

      return fetch(url, {
        ...options,
        headers,
      });
    },
    [isLoaded, isSignedIn, getToken],
  );

  const getListsForUser = useCallback(async () => {
    try {
      if (!isLoaded || !isSignedIn) {
        setLists([]);
        setSelectedId("");
        localStorage.removeItem("selectedId");
        return;
      }

      const res = await authenticatedFetch(BASE_URL);

      if (!res.ok) {
        throw new Error(`Failed to fetch lists: ${res.status}`);
      }

      const data = await res.json();
      const fetchedLists = data.data;
      setLists(fetchedLists);

      const savedId = localStorage.getItem("selectedId");

      const selectedList =
        fetchedLists.find((list) => list._id === savedId) ?? fetchedLists[0];

      if (selectedList) {
        setSelectedId(selectedList._id);
        localStorage.setItem("selectedId", selectedList._id);
      } else {
        setSelectedId("");
        localStorage.removeItem("selectedId");
      }
    } catch (err) {
      console.error("Error fetching user lists", err);
    }
  }, [isLoaded, isSignedIn, authenticatedFetch]);

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      getListsForUser();
    } else {
      setLists([]);
      setSelectedId("");
      localStorage.removeItem("selectedId");
    }
  }, [getListsForUser, isLoaded, isSignedIn]);

  const selectedList = useMemo(
    () => lists.find((list) => list._id === selectedId) ?? lists[0],
    [lists, selectedId],
  );

  const checkedCount =
    selectedList?.items.filter((item) => item.checked).length ?? 0;

  const toggleItem = async (itemId) => {
    const item = selectedList?.items.find((item) => item._id === itemId);

    if (!item) return;

    const previouslyChecked = item.checked;
    const nextChecked = !previouslyChecked;

    setLists((current) =>
      current.map((list) =>
        list._id === selectedId
          ? {
              ...list,
              items: list.items.map((item) =>
                item._id === itemId ? { ...item, checked: nextChecked } : item,
              ),
            }
          : list,
      ),
    );
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/${selectedId}/items/${itemId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            checked: nextChecked,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update item");
      }
    } catch (err) {
      setLists((current) =>
        current.map((list) =>
          list._id === selectedId
            ? {
                ...list,
                items: list.items.map((item) =>
                  item._id === itemId
                    ? { ...item, checked: previouslyChecked }
                    : item,
                ),
              }
            : list,
        ),
      );

      console.error("Error updating item:", err);
    }
  };

  const addItem = async (event) => {
    event.preventDefault();
    try {
      const label = newItem.trim();
      if (!label) return;

      const res = await authenticatedFetch(`${BASE_URL}/${selectedId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [
            {
              text: label,
            },
          ],
        }),
      });

      if (res.ok) {
        toast.success("Item added successfully");
      }

      getListsForUser();
      setNewItem("");
    } catch (err) {
      console.error("Error deleting list", err);
    }
  };

  const deleteItem = async (itemId) => {
    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/${selectedId}/items/${itemId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        toast.success("Item deleted Successfully");
      }

      getListsForUser();
    } catch (err) {
      console.error("Error deleting item", err);
    }
  };

  const uncheckAll = async () => {
    if (!selectedList || checkedCount === 0) return;

    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/${selectedId}/items/uncheck-all`,
        {
          method: "PATCH",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to uncheck items");
      }

      setLists((current) =>
        current.map((list) => (list._id === selectedId ? data.data : list)),
      );

      toast.success("All items unchecked");
    } catch (err) {
      console.error("Error unchecking all items:", err);
    }
  };

  const deleteCheckedItems = async () => {
    if (!selectedList || checkedCount === 0) return;

    if (!window.confirm("Delete checked items from hthis list?")) return;

    try {
      const res = await authenticatedFetch(
        `${BASE_URL}/${selectedId}/items/checked`,
        {
          method: "DELETE",
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete checked items");
      }

      setLists((current) =>
        current.map((list) => (list._id === selectedId ? data.data : list)),
      );

      toast.success("Checked items deleted successfully");
    } catch (err) {
      console.error("Error deleting checked items:", err);
    }
  };

  const deleteAllItems = async () => {
    if (!window.confirm("Delete every item in this checklist?")) return;
    try {
      const res = await authenticatedFetch(`${BASE_URL}/${selectedId}/items`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("All items deleted successfully");
      }

      getListsForUser();
    } catch (err) {
      console.error("Error deleting all items:", err);
    }
  };

  const deleteList = async () => {
    try {
      if (!selectedList || !window.confirm(`Delete “${selectedList.name}”?`)) {
        return;
      }

      const res = await authenticatedFetch(`${BASE_URL}/${selectedList._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("List deleted successfully");
      }

      getListsForUser();
    } catch (err) {
      console.error("Error deleting list", err);
    }
  };

  const addList = async (event) => {
    event.preventDefault();
    try {
      const name = newList.trim();
      if (!name) return;

      const res = await authenticatedFetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name }),
      });

      const data = await res.json();
      setSelectedId(data.data._id);
      localStorage.setItem("selectedId", data.data._id);
      setNewList("");
      setIsAddingList(false);

      if (res.ok) {
        toast.success("List added successfully");
        getListsForUser();
      }
    } catch (err) {
      console.error("Error fetching user lists", err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f1eb] p-3 text-[#24231f] sm:p-5 lg:p-7">
      <div className="mx-auto min-h-[calc(100vh-1.5rem)] max-w-360 overflow-hidden rounded-[26px] border border-black/[0.07] bg-[#fbfaf6] shadow-[0_24px_70px_rgba(45,43,36,0.08)] sm:min-h-[calc(100vh-2.5rem)] lg:min-h-[calc(100vh-3.5rem)]">
        <header className="flex h-19 items-center justify-between border-b border-black/[0.07] px-5 sm:px-7 lg:px-9">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#2f5d50] text-white shadow-[0_6px_14px_rgba(47,93,80,0.18)]">
              <svg className="size-4.5" viewBox="0 0 20 20" fill="none">
                <path
                  d="m5.1 10.2 3.1 3.1 6.9-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[16px] font-semibold tracking-[-0.02em]">
                Tally
              </p>
              <p className="hidden text-[11px] tracking-[0.02em] text-[#8a887f] sm:block">
                Make space for what matters
              </p>
            </div>
          </div>
          <Show when="signed-out">
            <SignInButton
              mode="modal"
              className="rounded-full border border-black/11 bg-[#2f5d50] text-white/90 px-4 py-2 text-[13px] font-medium shadow-sm transition hover:border-black/20 hover:bg-[#f8f7f2] hover:text-black/75 active:scale-[0.98] mr-2"
            />
            <SignUpButton
              mode="modal"
              className="rounded-full border border-black/11 bg-white px-4 py-2 text-[13px] font-medium shadow-sm transition hover:border-black/20 hover:bg-[#f8f7f2] active:scale-[0.98]"
            />
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
          {/* <button
            type="button"
            onClick={() => setIsLoggedIn((current) => !current)}
            className="rounded-full border border-black/11 bg-white px-4 py-2 text-[13px] font-medium shadow-sm transition hover:border-black/20 hover:bg-[#f8f7f2] active:scale-[0.98]"
          >
            {isLoggedIn ? "Log out" : "Log in"}
          </button> */}
        </header>

        <div className="grid min-h-[calc(100vh-6.25rem)] md:grid-cols-[270px_1fr] lg:grid-cols-[310px_1fr]">
          <aside className="border-b border-black/[0.07] bg-[#f6f4ee] px-4 py-5 md:border-r md:border-b-0 md:px-5 md:py-8">
            <Show when="signed-in">
              <div className="mb-4 flex items-center justify-between px-2">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[#87847b] uppercase">
                  Your checklists
                </p>
                <span className="rounded-full bg-black/5.5 px-2 py-0.5 text-[11px] font-medium text-[#77756d]">
                  {lists.length}
                </span>
              </div>

              <nav
                aria-label="Checklists"
                className="flex gap-2 overflow-x-auto pb-2 md:block md:space-y-1 md:overflow-visible md:pb-0"
              >
                {lists.map((list) => {
                  const done = list.items.filter((item) => item.checked).length;
                  return (
                    <button
                      key={list._id}
                      type="button"
                      onClick={() => {
                        setSelectedId(list._id);
                        localStorage.setItem("selectedId", list._id);
                      }}
                      className={`group flex min-w-52.5 items-center gap-3 rounded-xl px-3 py-3 text-left transition md:w-full md:min-w-0 ${
                        list._id === selectedId
                          ? "bg-white shadow-[0_4px_18px_rgba(50,48,40,0.07)] ring-1 ring-black/4"
                          : "hover:bg-black/2.5"
                      }`}
                    >
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                          list._id === selectedId
                            ? "bg-[#dfeae3] text-[#2f5d50]"
                            : "bg-black/4.5 text-[#77756d]"
                        }`}
                      >
                        <span className="size-4.25">
                          <ListIcon />
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {list.name}
                        </span>
                        <span className="mt-0.5 block text-[11px] text-[#918f87]">
                          {done} of {list.items.length} done
                        </span>
                      </span>
                    </button>
                  );
                })}
              </nav>

              {isAddingList ? (
                <form
                  onSubmit={addList}
                  className="mt-3 rounded-xl bg-white p-3"
                >
                  <input
                    autoFocus
                    value={newList}
                    onChange={(event) => setNewList(event.target.value)}
                    placeholder="List name"
                    aria-label="New list name"
                    className="w-full border-b border-black/10 bg-transparent px-1 py-2 text-[13px] outline-none placeholder:text-[#aaa79d] focus:border-[#2f5d50]"
                  />
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-lg bg-[#2f5d50] px-3 py-1.5 text-[11px] font-semibold text-white">
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingList(false);
                        setNewList("");
                      }}
                      className="px-2 py-1.5 text-[11px] font-medium text-[#77756d]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingList(true)}
                  className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-black/13 px-4 py-3 text-[12px] font-medium text-[#6d6b63] transition hover:border-[#2f5d50]/40 hover:bg-white hover:text-[#2f5d50]"
                >
                  <span className="size-4">
                    <PlusIcon />
                  </span>
                  New checklist
                </button>
              )}
            </Show>
          </aside>

          <main className="px-5 py-9 sm:px-8 lg:px-[clamp(3rem,8vw,8.5rem)] lg:py-16">
            <Show when="signed-in">
              {selectedList && (
                <div className="mx-auto max-w-190">
                  <div className="mb-8 flex items-end justify-between gap-6">
                    <div>
                      <p className="mb-2 text-[11px] font-semibold tracking-[0.13em] text-[#a26845] uppercase">
                        Current checklist
                      </p>
                      <h1 className="text-[clamp(2rem,4vw,3.4rem)] leading-[1.05] font-semibold tracking-[-0.045em]">
                        {selectedList.name}
                      </h1>
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      <div className="hidden text-right sm:block">
                        <p className="text-2xl font-semibold tracking-[-0.04em]">
                          {checkedCount}
                          <span className="text-[#aaa79e]">
                            /{selectedList.items.length}
                          </span>
                        </p>
                        <p className="text-[11px] text-[#8e8b82]">checked</p>
                      </div>
                      <button
                        type="button"
                        onClick={deleteList}
                        title="Delete checklist"
                        aria-label={`Delete ${selectedList.name}`}
                        className="flex size-9 items-center justify-center rounded-lg border border-[#a94f3d]/15 text-[#a94f3d] transition hover:border-[#a94f3d]/25 hover:bg-[#a94f3d]/6"
                      >
                        <span className="size-4.25 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-[1.5] [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round]">
                          <TrashIcon />
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-black/5.5">
                    <div
                      className="h-full rounded-full bg-[#d28a58] transition-[width] duration-500"
                      style={{
                        width: `${
                          selectedList.items.length
                            ? (checkedCount / selectedList.items.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>

                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={uncheckAll}
                      disabled={checkedCount === 0}
                      className="rounded-lg border border-black/8 bg-white px-3 py-1.5 text-[11px] font-medium text-[#68665f] transition hover:border-black/[0.14] hover:text-[#2f5d50] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Uncheck all
                    </button>
                    <button
                      type="button"
                      onClick={deleteCheckedItems}
                      disabled={checkedCount === 0}
                      className="rounded-lg border border-black/8 bg-white px-3 py-1.5 text-[11px] font-medium text-[#68665f] transition hover:border-[#a94f3d]/20 hover:text-[#a94f3d] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete checked
                    </button>
                    <button
                      type="button"
                      onClick={deleteAllItems}
                      disabled={selectedList.items.length === 0}
                      className="rounded-lg border border-black/8 bg-white px-3 py-1.5 text-[11px] font-medium text-[#68665f] transition hover:border-[#a94f3d]/20 hover:text-[#a94f3d] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Delete all
                    </button>
                  </div>

                  <div className="divide-y divide-black/6.5 border-y border-black/6.5">
                    {selectedList.items.map((item) => (
                      <div
                        key={item._id}
                        className="group flex items-center gap-4 py-4.5"
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-4">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleItem(item._id)}
                            className="peer sr-only"
                          />
                          <span className="flex size-5.5 shrink-0 items-center justify-center rounded-[7px] border border-black/20 text-transparent transition group-hover:border-[#2f5d50]/60 peer-checked:border-[#2f5d50] peer-checked:bg-[#2f5d50] peer-checked:text-white">
                            <span className="size-3.5 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-2 [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round]">
                              <CheckIcon />
                            </span>
                          </span>
                          <span
                            className={`min-w-0 flex-1 truncate text-[15px] tracking-[-0.01em] transition ${
                              item.checked
                                ? "text-[#aaa79e] line-through decoration-[#aaa79e]"
                                : "text-[#34332f]"
                            }`}
                          >
                            {item.text}
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={() => deleteItem(item._id)}
                          aria-label={`Delete ${item.label}`}
                          title="Delete item"
                          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-[#aaa79e] opacity-100 transition hover:bg-[#a94f3d]/6 hover:text-[#a94f3d] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        >
                          <span className="size-4 [&_path]:fill-none [&_path]:stroke-current [&_path]:stroke-[1.5] [&_path]:[stroke-linecap:round] [&_path]:[stroke-linejoin:round]">
                            <TrashIcon />
                          </span>
                        </button>
                      </div>
                    ))}
                    {selectedList.items.length === 0 && (
                      <div className="py-12 text-center">
                        <p className="text-[14px] font-medium text-[#646159]">
                          A fresh start.
                        </p>
                        <p className="mt-1 text-[12px] text-[#99968d]">
                          Add the first item to this checklist below.
                        </p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={addItem} className="mt-6 flex gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-black/9 bg-white px-4 shadow-[0_5px_20px_rgba(50,48,40,0.035)] focus-within:border-[#2f5d50]/40 focus-within:ring-3 focus-within:ring-[#2f5d50]/6">
                      <span className="size-4.25 shrink-0 text-[#aaa79e]">
                        <PlusIcon />
                      </span>
                      <input
                        value={newItem}
                        onChange={(event) => setNewItem(event.target.value)}
                        placeholder="Add a new item..."
                        aria-label="New checklist item"
                        className="h-12 w-full bg-transparent text-[14px] outline-none placeholder:text-[#aaa79e]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#24231f] px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#38362f] active:scale-[0.98]"
                    >
                      Add item
                    </button>
                  </form>

                  <p className="mt-4 text-[11px] text-[#9a978e]">
                    Press Enter to quickly add an item
                  </p>
                </div>
              )}
              {!selectedList && (
                <div className="mx-auto flex max-w-130 flex-col items-center py-20 text-center">
                  <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#dfeae3] text-[#2f5d50]">
                    <span className="size-5">
                      <ListIcon />
                    </span>
                  </div>
                  <h1 className="text-2xl font-semibold tracking-[-0.03em]">
                    No checklists yet
                  </h1>
                  <p className="mt-2 text-[13px] text-[#8e8b82]">
                    Create a new checklist from the sidebar to get started.
                  </p>
                </div>
              )}
            </Show>
            <Show when="signed-out">
              <div className="mx-auto flex max-w-130 flex-col items-center py-20 text-center">
                <div>
                  <SignInButton
                    mode="modal"
                    className="rounded-full border border-black/11 bg-[#2f5d50] text-white/90 px-4 py-2 text-[13px] font-medium shadow-sm transition hover:border-black/20 hover:bg-[#f8f7f2] hover:text-black/75 active:scale-[0.98] mr-2"
                  />
                  <SignUpButton
                    mode="modal"
                    className="rounded-full border border-black/11 bg-white px-4 py-2 text-[13px] font-medium shadow-sm transition hover:border-black/20 hover:bg-[#f8f7f2] active:scale-[0.98]"
                  />
                </div>
                <p className="mt-2 text-[13px] text-[#8e8b82]">
                  Please Sign in or Register to get started.
                </p>
              </div>
            </Show>
          </main>
        </div>
      </div>
    </div>
  );
};
