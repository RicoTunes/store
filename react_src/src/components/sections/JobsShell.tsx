import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { jobsApi } from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import { INTENT } from '@/config/site';

export function JobsShell({ id, title, body }: { id?: string; title: string; body: string }) {
  const { user } = useAuth() as any;
  const design = ((INTENT as any).socialDesign && typeof (INTENT as any).socialDesign === 'object')
    ? ((INTENT as any).socialDesign as Record<string, string>)
    : {};
  const jobsLayout = String(design.jobs_layout || 'jobs-list');
  const params = useParams();
  const jobId = String((params as any).jobId || '');
  const [jobs, setJobs] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [detail, setDetail] = useState<any>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [cover, setCover] = useState('');
  const [form, setForm] = useState({ title: '', company: '', location: '', description: '', employment_type: 'full_time' });
  const [status, setStatus] = useState('');

  async function load() {
    const data = await jobsApi.list(q);
    setJobs(data?.jobs || []);
  }
  useEffect(() => { void load().catch(() => setJobs([])); }, []);
  useEffect(() => {
    if (!jobId) { setDetail(null); return; }
    void jobsApi.get(jobId).then((d) => setDetail(d?.job || null)).catch(() => setDetail(null));
    void jobsApi.applications(jobId).then((d) => setApps(d?.applications || [])).catch(() => setApps([]));
  }, [jobId]);

  async function postJob(e: FormEvent) {
    e.preventDefault();
    try {
      await jobsApi.create(form);
      setForm({ title: '', company: '', location: '', description: '', employment_type: 'full_time' });
      setStatus('Job posted.');
      await load();
    } catch (err: any) {
      setStatus(err?.message || 'Could not post job');
    }
  }

  if (!user?.id) {
    return (
      <section id={id} className="px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">{title || 'Jobs'}</h1>
        <p className="mt-2 text-muted">Sign in to post and apply.</p>
        <Link to="/login" className="mt-4 inline-block text-sm font-semibold text-primary">Log in</Link>
      </section>
    );
  }

  if (jobId && detail) {
    return (
      <section id={id} className="mx-auto max-w-3xl px-4 py-6">
        <Link to="/jobs" className="text-sm font-semibold text-primary">← Jobs</Link>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ink">{detail.title}</h1>
        <p className="mt-1 text-sm text-muted">{detail.company} · {detail.location} · {String(detail.employment_type || '').replace('_', ' ')}</p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{detail.description}</p>
        <p className="mt-2 text-xs text-muted">{detail.applicants || 0} applicants</p>
        {detail.poster_id === user.id ? (
          <div className="mt-6">
            <h2 className="text-sm font-bold">Applications</h2>
            <ul className="mt-2 space-y-2">
              {apps.map((a) => (
                <li key={a.id} className="rounded-xl bg-surface p-3 text-sm ring-1 ring-black/5">
                  <p className="font-semibold">{a.user_id}</p>
                  <p className="text-muted">{a.cover_letter}</p>
                </li>
              ))}
              {!apps.length ? <li className="text-sm text-muted">No applications yet.</li> : null}
            </ul>
          </div>
        ) : (
          <form className="mt-6 space-y-2" onSubmit={async (e) => {
            e.preventDefault();
            try {
              await jobsApi.apply(detail.id, { cover_letter: cover });
              setStatus('Applied.');
              setDetail({ ...detail, applied: true });
            } catch (err: any) {
              setStatus(err?.message || 'Could not apply');
            }
          }}>
            <textarea value={cover} onChange={(e) => setCover(e.target.value)} rows={4} placeholder="Cover letter" className="w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
            <Button type="submit" disabled={detail.applied}>{detail.applied ? 'Applied' : 'Apply'}</Button>
          </form>
        )}
        {status ? <p className="mt-2 text-sm text-muted">{status}</p> : null}
      </section>
    );
  }

  const jobsShell =
    jobsLayout === 'jobs-cards'
      ? 'mx-auto max-w-5xl px-4 py-6'
      : jobsLayout === 'jobs-split'
        ? 'mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_320px]'
        : 'mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_280px]';

  return (
    <section id={id} className={`${jobsShell} social-jobs--${jobsLayout}`}>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">{title || 'Jobs'}</h1>
        <p className="mt-1 text-sm text-muted">{body}</p>
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void load(); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs" className="flex-1 rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
          <Button type="submit">Search</Button>
        </form>
        <ul className={jobsLayout === 'jobs-cards' ? 'mt-4 grid gap-3 sm:grid-cols-2' : 'mt-4 space-y-3'}>
          {jobs.map((j) => (
            <li key={j.id} className="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
              <Link to={`/jobs/${j.id}`} className="font-semibold text-ink hover:underline">{j.title}</Link>
              <p className="text-sm text-muted">{j.company} · {j.location} · {String(j.employment_type || '').replace('_', ' ')}</p>
              <p className="mt-1 line-clamp-2 text-sm text-ink">{j.description}</p>
            </li>
          ))}
          {!jobs.length ? <li className="text-sm text-muted">No jobs yet — post an opening.</li> : null}
        </ul>
      </div>
      <aside>
        <form onSubmit={(e) => void postJob(e)} className="rounded-2xl bg-surface p-4 ring-1 ring-black/5">
          <p className="text-sm font-bold">Post a job</p>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="mt-3 w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className="mt-2 w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="mt-2 w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
          <select value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} className="mt-2 w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm">
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="remote">Remote</option>
          </select>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Description" className="mt-2 w-full rounded-lg border border-black/10 bg-background px-3 py-2 text-sm" />
          <Button type="submit" className="mt-3">Publish</Button>
          {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
        </form>
      </aside>
    </section>
  );
}
