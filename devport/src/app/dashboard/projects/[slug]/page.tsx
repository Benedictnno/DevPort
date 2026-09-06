import { auth } from "@/lib/auth";
import { getProject } from "@/modules/projects/project.service";
import { notFound, redirect } from "next/navigation";
import { ProjectEditor } from "@/components/projects/project-editor";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: slug };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  let project;
  try {
    project = await getProject(slug, session.user.id);
  } catch {
    notFound();
  }

  return <ProjectEditor project={project} />;
}
