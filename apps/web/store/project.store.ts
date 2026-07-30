import { create } from 'zustand';

type Message = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    projectId: string;
}

type File = {
    path: string;
    content: string;
}

type Project = {
    id: string;
    name: string;
    previewUrl?: string;
}

type Store = {
  
    messages:        Message[];
    files:           File[];
    selectedFile:    File | null;
    isAgentThinking: boolean;
    previewUrl:      string | null;
    currentProject:  Project | null;

    setMessages:        (messages: Message[]) => void;
    addMessage:         (message: Message) => void;
    appendToken:        (text: string) => void;
    setFiles:           (files: File[]) => void;
    upsertFile:         (file: File) => void;
    setSelectedFile:    (file: File | null) => void;
    setIsAgentThinking: (bool: boolean) => void;
    setPreviewUrl:      (url: string) => void;
    setCurrentProject:  (project: Project) => void;
}

export const useProjectStore = create<Store>((set) => ({

    messages:        [],
    files:           [],
    selectedFile:    null,
    isAgentThinking: false,
    previewUrl:      null,
    currentProject:  null,


    setMessages: (messages) => set({ messages }),

    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),

    appendToken: (text) => set((state) => {
        const messages = [...state.messages];
        const last = messages[messages.length - 1];

        if (last && last.role === 'assistant') {
            messages[messages.length - 1] = {
                ...last,
                content: last.content + text  
            };
        }

        return { messages };
    }),

    setFiles: (files) => set({ files }),

    upsertFile: (file) => set((state) => {
        const exists = state.files.findIndex((f) => f.path === file.path);

        if (exists !== -1) {
            
            const files = [...state.files];
            files[exists] = file;
            return { files };
        }

        return { files: [...state.files, file] };
    }),

    setSelectedFile:    (file)    => set({ selectedFile: file }),
    setIsAgentThinking: (bool)    => set({ isAgentThinking: bool }),
    setPreviewUrl:      (url)     => set({ previewUrl: url }),
    setCurrentProject:  (project) => set({ currentProject: project }),
}));