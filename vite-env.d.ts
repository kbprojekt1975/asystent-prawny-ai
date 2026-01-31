/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_USE_EMULATORS: string;
    // add more env variables here if needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
