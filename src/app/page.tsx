import PageShell from "@/app/components/page-shell";
import Link from "next/link";

export default function Home() {
  const coreModules = [
    {
      href: "/teams",
      title: "Teams",
      description: "Participating teams and details.",
    },
    {
      href: "/matches",
      title: "Matches",
      description: "Scheduled competitions and results.",
    },
    {
      href: "/scientific-projects",
      title: "Scientific Projects",
      description: "Innovation projects by edition.",
    },
    {
      href: "/project-rooms",
      title: "Project Rooms",
      description: "Judging rooms, panels and assigned projects.",
    }
  ];

  return (
    <PageShell
      eyebrow="International STEM program"
      title="First LEGO League"
      description="Robotics, innovation and teamwork for young participants."
    >
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="page-eyebrow">Competition hub</div>
          <h2 className="section-title">Platform modules</h2>
          <p className="section-copy max-w-2xl">
            Explore the main areas of the platform for teams, editions and innovation projects.
          </p>
        </div>

        <div className="module-grid">
          {coreModules.map((module) => (
            <Link key={module.href} href={module.href} className="module-card">
              <h2 className="module-title">{module.title}</h2>
              <p className="module-copy">{module.description}</p>
              <span className="module-link">Open module</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-border pt-4 text-sm font-medium text-muted-foreground">
          Innovation project, robot game and core values.
        </div>
      </div>
    </PageShell>
  );
}
