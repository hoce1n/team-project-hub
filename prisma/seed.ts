import { prisma } from "@/lib/db";

const DEMO_WORKSPACE_SLUG = "acme";

async function main() {
  console.log("Seeding demo data...");

  const owner = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      name: "Demo Owner",
      email: "demo@example.com",
      emailVerified: true,
    },
  });

  const member = await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      name: "Demo Member",
      email: "member@example.com",
      emailVerified: true,
    },
  });

  await prisma.workspace.deleteMany({
    where: { slug: DEMO_WORKSPACE_SLUG },
  });

  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Inc",
      slug: DEMO_WORKSPACE_SLUG,
      members: {
        create: [
          { userId: owner.id, role: "OWNER" },
          { userId: member.id, role: "MEMBER" },
        ],
      },
    },
  });

  const websiteRedesign = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Refresh the marketing site with the new brand guidelines.",
      workspaceId: workspace.id,
      createdById: owner.id,
    },
  });

  const mobileApp = await prisma.project.create({
    data: {
      name: "Mobile App Launch",
      description: "Ship v1 of the iOS and Android apps.",
      workspaceId: workspace.id,
      createdById: owner.id,
    },
  });

  const task1 = await prisma.task.create({
    data: {
      title: "Set up design tokens",
      description: "Colors, typography, spacing scales.",
      status: "DONE",
      priority: "HIGH",
      projectId: websiteRedesign.id,
      assigneeId: owner.id,
      createdById: owner.id,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: "Homepage hero section",
      description: "New hero with product screenshot.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: websiteRedesign.id,
      assigneeId: member.id,
      createdById: owner.id,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: "App store screenshots",
      description: "Capture and prepare 6.7-inch screenshots.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projectId: mobileApp.id,
      assigneeId: member.id,
      createdById: owner.id,
    },
  });

  await prisma.taskComment.create({
    data: {
      body: "Landing page copy is ready in Figma. Ping me for the link.",
      taskId: task2.id,
      authorId: owner.id,
    },
  });

  await prisma.taskComment.create({
    data: {
      body: "Screenshot tools should follow Apple's latest guidance.",
      taskId: task3.id,
      authorId: member.id,
    },
  });

  await prisma.attachment.create({
    data: {
      filename: "brand-guidelines.pdf",
      mimeType: "application/pdf",
      size: 245760,
      taskId: task1.id,
      uploadedById: owner.id,
    },
  });

  console.log("Seed complete.");
  console.log(
    `Workspace: ${workspace.slug}  |  Owner: demo@example.com  |  Member: member@example.com`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
