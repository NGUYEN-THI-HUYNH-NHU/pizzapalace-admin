import { useSyncExternalStore } from 'react';

function subscribe() {
    return () => { };
}

export const useOrigin = () => {
    const origin = useSyncExternalStore(
        subscribe,
        () => window.location.origin,
        () => ''
    );

    return origin;
};