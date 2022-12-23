import { nanoid } from "nanoid";
import { Reflect } from "@rocicorp/reflect";
import { useSubscribe } from "replicache-react";

import { M, mutators } from "./mutators";
import { listTodos, TodoUpdate } from "./todo";

import Header from "./components/header";
import MainSection from "./components/main-section";

import { useEffect } from "react"

const socketOrigin =
  import.meta.env.VITE_WORKER_URL ??
  "wss://reflect-todo.replicache.workers.dev";

// This is the top-level component for our app.
const App = ({ reflect, userID, roomID }: { reflect: Reflect<M> }) => {
  // Subscribe to all todos and sort them.
  const todos = useSubscribe(reflect, listTodos, [], [reflect]);
  todos.sort((a, b) => a.sort - b.sort);

  useEffect(() => {
    void (async() => {
      await reflect.mutate.init();
      console.log("entries original reflect", await reflect.query(tx => tx.scan().entries().toArray()))

      const r = new Reflect({
        socketOrigin,
        userID,
        roomID,
        auth: userID,
        mutators,
      });

      console.log("entries second reflect", await r.query(tx => tx.scan().entries().toArray()))

      r.subscribe(
        async tx => await tx.scan().entries().toArray(), 
        {
          onData(result) {
            console.log("second subscribe", result)
          }
        }
      )
    })();
  }, [])

  // Define event handlers and connect them to Replicache mutators. Each
  // of these mutators runs immediately (optimistically) locally, then runs
  // again on the server-side automatically.
  const handleNewItem = (text: string) =>
    reflect.mutate.createTodo({
      id: nanoid(),
      text,
      completed: false,
    });

  const handleUpdateTodo = (update: TodoUpdate) =>
    reflect.mutate.updateTodo(update);

  const handleDeleteTodos = async (ids: string[]) => {
    for (const id of ids) {
      await reflect.mutate.deleteTodo(id);
    }
  };

  const handleCompleteTodos = async (completed: boolean, ids: string[]) => {
    for (const id of ids) {
      await reflect.mutate.updateTodo({
        id,
        completed,
      });
    }
  };

  // Render app.

  return (
    <div className="todoapp">
      <Header onNewItem={handleNewItem} />
      <MainSection
        todos={todos}
        onUpdateTodo={handleUpdateTodo}
        onDeleteTodos={handleDeleteTodos}
        onCompleteTodos={handleCompleteTodos}
      />
    </div>
  );
};

export default App;
