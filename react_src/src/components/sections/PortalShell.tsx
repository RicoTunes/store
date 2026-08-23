import { Link } from 'react-router-dom';
import { Container } from '@/components/ui/Container';

const COURSES = [
  {
    id: 'c1',
    title: 'Foundations Studio',
    summary: 'Core methods, critique cadence, and project briefs.',
    meta: '8 weeks · Beginner',
  },
  {
    id: 'c2',
    title: 'Systems Lab',
    summary: 'Tokens, components, and documentation for product teams.',
    meta: '6 weeks · Intermediate',
  },
  {
    id: 'c3',
    title: 'Agent Workflows',
    summary: 'Bounded tools, evaluation loops, and operator UX.',
    meta: '4 weeks · Advanced',
  },
];

export function PortalShell({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Courses</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {COURSES.map((course) => (
            <article
              key={course.id}
              className="flex flex-col rounded-[var(--radius-md)] bg-surface p-6 ring-1 ring-black/5 transition hover:-translate-y-0.5"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{course.meta}</p>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                <Link to={`/courses/${course.id}`} className="hover:text-primary">
                  {course.title}
                </Link>
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted">{course.summary}</p>
              <Link
                to={`/courses/${course.id}`}
                className="mt-4 text-sm font-semibold text-primary hover:underline"
              >
                Open course →
              </Link>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
