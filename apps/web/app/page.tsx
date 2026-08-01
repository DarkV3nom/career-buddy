export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold text-primary">
        Career Application Assistant
      </h1>
      <p className="max-w-md text-center text-muted-foreground">
        Chat, resume editor, and interview prep views live under{" "}
        <code className="font-mono text-sm">app/(app)/</code>. This is the
        scaffold root — see <code className="font-mono text-sm">components/chat</code>{" "}
        and <code className="font-mono text-sm">components/resume-editor</code>.
      </p>
    </main>
  );
}
