import { describe, expect, it } from "vitest";
import {
  subscribeToComments,
  publishComment,
  eventIsForTask,
  type CommentEvent,
} from "./comment-stream";

const event: CommentEvent = {
  id: "c1",
  taskId: "t1",
  body: "hello",
  authorId: "u1",
  authorName: "Ada",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("subscribeToComments", () => {
  it("delivers published comments to listeners", () => {
    const received: CommentEvent[] = [];
    const unsubscribe = subscribeToComments("t1", (data) => received.push(data));
    publishComment(event);
    expect(received).toEqual([event]);
    unsubscribe();
  });

  it("stops delivering after unsubscribe", () => {
    const received: CommentEvent[] = [];
    const unsubscribe = subscribeToComments("t1", (data) => received.push(data));
    unsubscribe();
    publishComment(event);
    expect(received).toEqual([]);
  });
});

describe("eventIsForTask", () => {
  it("compares against the event task id", () => {
    expect(eventIsForTask(event, "t1")).toBe(true);
    expect(eventIsForTask(event, "t2")).toBe(false);
  });
});
