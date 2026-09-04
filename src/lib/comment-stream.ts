import { EventEmitter } from "node:events";

export type CommentEvent = {
  id: string;
  taskId: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

const hub = new EventEmitter();
const SUBSCRIBE_EVENT = "comment";

export function subscribeToComments(taskId: string, listener: (data: CommentEvent) => void): () => void {
  hub.on(SUBSCRIBE_EVENT, listener);
  return () => {
    hub.off(SUBSCRIBE_EVENT, listener);
  };
}

export function publishComment(comment: CommentEvent): void {
  hub.emit(SUBSCRIBE_EVENT, comment);
}

export function eventIsForTask(comment: CommentEvent, taskId: string): boolean {
  return comment.taskId === taskId;
}
