# @legit-sdk/react

Thin React wrapper around `@legit-sdk/core` providing a provider for SDK initialization and a hook to work with file content and history.

## Install

```bash
pnpm add @legit-sdk/core @legit-sdk/react
```

Peer dependencies: `react >=18`.

## Quick start

- Wrap your app with `LegitProvider` once.
- Use `useLegitFile(path)` inside components to read/update a file and access history.

```tsx
import React from 'react';
import { LegitProvider, useLegitFile } from '@legit-sdk/react';

function Editor() {
  const { content, setContent, history, loading, error } =
    useLegitFile('/doc.txt');
  const [text, setText] = React.useState(content);

  React.useEffect(() => setText(content), [content]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => setContent(text)}>Save</button>
      <div>History entries: {history.length}</div>
    </div>
  );
}

export default function App() {
  return (
    <LegitProvider>
      <Editor />
    </LegitProvider>
  );
}
```

## API

- `LegitProvider`: initializes a shared SDK instance and polls repository HEAD.
- `useLegitFile(path: string)` returns:
  - `content: string`
  - `setContent(newText: string): Promise<void>`
  - `history: HistoryItem[]`
  - `getPastState(commitHash: string): Promise<string>`
  - `loading: boolean`
  - `error?: Error`

You can also access the provider context via `useLegitContext()` for advanced scenarios.

## Types

- `UseLegitFileReturn`
- `LegitContextValue`, `LegitProviderProps`
- `HistoryItem` is exported by `@legit-sdk/core` and used in the hook return type.

## Notes

- This package does not bundle `react` or `@legit-sdk/core`; install them in your app.
- The provider should be mounted once at the root of your React tree.
