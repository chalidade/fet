# @chalidade/react-hooks

React hooks kecil yang aman untuk SSR dan teruji: `useDebouncedValue`, `useDebouncedCallback`,
`useThrottledCallback`, `useOnline`,
`useMediaQuery`, `useLocalStorage`, `useEventListener`, `useOnClickOutside`,
`useIntersectionObserver`, `usePrevious`, `useLatest`, `useIsomorphicLayoutEffect`.

```tsx
import { useDebouncedValue, useMediaQuery } from "@chalidade/react-hooks";

const query = useDebouncedValue(input, 300);
const isMobile = useMediaQuery("(max-width: 640px)");
```

Dokumentasi lengkap: https://chalidade.github.io/front-end-training/toolkit/react-hooks
