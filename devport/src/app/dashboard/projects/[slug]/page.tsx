import { auth } from "@/lib/auth";
import { getProject } from "@/modules/projects/project.service";
import { notFound } from "next/navigation";
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

  try {
    const project = await getProject(slug, session!.user.id);
    return <ProjectEditor project={project} />;
  } catch {
    notFound();
  }
}
