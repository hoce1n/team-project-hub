import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getMembershipBySlug } from "@/lib/membership";
import { prisma } from "@/lib/db";
import { can } from "@/lib/authz";
import { TaskEditForm } from "./task-edit-form";
import { DeleteTaskForm } from "./delete-task-form";
import { TaskCommentStream } from "./task-comment-stream";
import type { RenderableComment } from "./task-comment-stream";
import { NewCommentForm } from "./new-comment-form";
import { AttachmentUploadForm } from "./attachment-upload-form";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string; taskId: string }>;
}) {
  const { slug, id, taskId } = await params;
  const user = await requireUser();
  const membership = await getMembershipBySlug(user.id, slug);
  if (!membership) {
    notFound();
  }

  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      projectId: id,
      project: { workspaceId: membership.workspace.id },
    },
    include: {
      project: { select: { id: true, name: true, workspaceId: true } },
      createdBy: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });
  if (!task) {
    notFound();
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: membership.workspace.id },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const comments = await prisma.taskComment.findMany({
    where: { taskId: task.id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const attachments = await prisma.attachment.findMany({
    where: { taskId: task.id },
    include: { uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const canModerate = can(membership.role, "manageProjects");
  const renderableComments: RenderableComment[] = comments.map((comment) => ({
    id: comment.id,
    taskId: comment.taskId,
    body: comment.body,
    authorId: comment.author.id,
    authorName: comment.author.name ?? comment.author.id,
    createdAt: comment.createdAt.toISOString(),
    canDelete: comment.authorId === user.id || canModerate,
  }));

  const canDelete =
    task.createdById === user.id || canModerate;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/w/${slug}/p/${task.project.id}`}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ← {task.project.name}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{task.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        Created by {task.createdBy.name}
        {task.assignee ? ` · Assigned to ${task.assignee.name}` : ""}
      </p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <TaskEditForm
          taskId={task.id}
          title={task.title}
          description={task.description}
          priority={task.priority}
          dueDate={task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null}
          assigneeId={task.assigneeId}
          members={members.map((member) => ({
            id: member.user.id,
            name: member.user.name ?? member.user.id,
          }))}
        />
      </div>

      {canDelete && (
        <div className="mt-4 flex justify-end">
          <DeleteTaskForm taskId={task.id} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>
        {attachments.length > 0 && (
          <ul className="mt-3 space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {attachment.storedName ? (
                  <a
                    href={`/api/attachments/${attachment.id}`}
                    className="font-medium text-slate-900 underline"
                  >
                    {attachment.filename}
                  </a>
                ) : (
                  <span className="font-medium text-slate-500">
                    {attachment.filename}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  {(attachment.size / 1024).toFixed(1)} KB ·{" "}
                  {attachment.uploadedBy.name ?? "Unknown"}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <AttachmentUploadForm taskId={task.id} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">
          Comments ({comments.length})
        </h2>
        <div className="mt-4">
          <TaskCommentStream
            taskId={task.id}
            comments={renderableComments}
          />
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <NewCommentForm taskId={task.id} />
        </div>
      </section>
    </div>
  );
}
