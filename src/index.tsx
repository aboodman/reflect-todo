import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./app";
import { mutators } from "./mutators";
import { Reflect } from "@rocicorp/reflect";
import { nanoid } from "nanoid";

const userID = "u42";
const roomID: string | undefined = import.meta.env.VITE_ROOM_ID;
if (roomID === undefined || roomID === "") {
  throw new Error("VITE_ROOM_ID required");
}
const socketOrigin =
  import.meta.env.VITE_WORKER_URL ??
  "wss://reflect-todo.replicache.workers.dev";

const r = new Reflect({
  socketOrigin,
  userID,
  roomID,
  auth: userID,
  mutators,
});

r.subscribe(
  async tx => await tx.scan().entries().toArray(), 
  {
    onData(result) {
      console.log("first subscribe", result)
    }
  }
)

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App reflect={r} userID={userID} roomID={roomID}/>
);
