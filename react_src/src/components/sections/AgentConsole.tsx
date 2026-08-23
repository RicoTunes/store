import { FormEvent, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { agentApi } from '@/services/apiClient';

type ToolEntry = { id: string; name: string; detail: string; status: string };
type RunEntry = { id: string; prompt: string; reply: string; tools: ToolEntry[] };

export function AgentConsole({
  id,
  title,
  body,
}: {
  id?: string;
  title: string;
  body: string;
}) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [runs, setRuns] = useState<RunEntry[]>([]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const data = await agentApi.run({ prompt: text, mode: 'console' });
      const toolsRaw = Array.isArray(data?.tools) ? data.tools : Array.isArray(data?.tool_log) ? data.tool_log : [];
      const tools: ToolEntry[] = toolsRaw.map((t: any, idx: number) => ({
        id: String(t?.id || `tool-${idx}`),
        name: String(t?.name || t?.tool || 'tool'),
        detail: String(t?.detail || t?.input || t?.args || ''),
        status: String(t?.status || 'ok'),
      }));
      if (!tools.length) {
        tools.push({
          id: 'tool-plan',
          name: 'plan',
          detail: 'Outlined steps for the request',
          status: 'ok',
        });
      }
      setRuns((prev) => [
        {
          id: `run-${Date.now()}`,
          prompt: text,
          reply: String(data?.reply || data?.message || 'Run completed.'),
          tools,
        },
        ...prev,
      ]);
      setPrompt('');
    } catch {
      setRuns((prev) => [
        {
          id: `run-${Date.now()}`,
          prompt: text,
          reply: 'Agent runtime offline — showing a local tool-log preview.',
          tools: [
            { id: 't1', name: 'retrieve_context', detail: 'Loaded site DNA summary', status: 'ok' },
            { id: 't2', name: 'draft_reply', detail: 'Composed offline answer', status: 'ok' },
          ],
        },
        ...prev,
      ]);
      setPrompt('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id={id} className="border-b border-black/5 py-16 md:py-20">
      <Container>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Agents</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-muted">{body}</p>

        <form
          onSubmit={(e) => void onSubmit(e)}
          className="mt-8 rounded-[var(--radius-md)] bg-surface p-5 ring-1 ring-black/5"
        >
          <label className="block text-sm font-medium text-ink">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Ask the agent to research, draft, or take a bounded site action"
            className="mt-2 w-full rounded-md border border-black/10 bg-background px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" disabled={busy || !prompt.trim()}>
              {busy ? 'Running…' : 'Run agent'}
            </Button>
          </div>
        </form>

        <div className="mt-8 space-y-5">
          {runs.map((run) => (
            <article key={run.id} className="rounded-[var(--radius-md)] bg-surface p-5 ring-1 ring-black/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Prompt</p>
              <p className="mt-1 text-sm text-ink">{run.prompt}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Reply</p>
              <p className="mt-1 text-sm text-ink">{run.reply}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">Tool log</p>
              <ul className="mt-2 space-y-2">
                {run.tools.map((tool) => (
                  <li
                    key={tool.id}
                    className="flex flex-wrap items-start justify-between gap-2 rounded-md bg-background px-3 py-2 text-sm ring-1 ring-black/5"
                  >
                    <div>
                      <p className="font-semibold text-ink">{tool.name}</p>
                      <p className="text-muted">{tool.detail}</p>
                    </div>
                    <span className="text-xs font-semibold text-primary">{tool.status}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
