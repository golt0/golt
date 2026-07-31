const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

export function isAuthError(err: unknown): boolean {
    return err instanceof ApiError && err.status === 401;
}

export function getToken() : string | null {
    if(typeof window === "undefined") return null;
    return localStorage.getItem('token')
}

export function setToken(token : string) : void {
    if(typeof window === "undefined") return ;
    return localStorage.setItem('token' , token)
}

export function removeToken() : void {
    if(typeof window === "undefined") return ;
    localStorage.removeItem('token')
}

export function logout() : void {
    removeToken();
    if(typeof window !== "undefined") {
         window.location.href = "/login"
    }
}


async function  apiFetch(path : string , options : RequestInit = {}) {
    const token  = getToken();
    console.log("token ", token)

    const res = await fetch(`${BASE_URL}${path}` ,  {
        ...options,
        headers : {
            'Content-Type' : 'application/json',
            ...(token ? {Authorization : `Bearer ${token}`} : {}),
            ...options.headers,
        },
    });

    const data = await res.json().catch(() => ({}));

    if(!res.ok) {
        throw new ApiError(res.status, data.error || 'something went wrong')
    }

    return data;
}

export async function signup(name : string , email : string, password : string) {
    const data = await apiFetch("/auth/signup", {
        method : 'POST',
        body : JSON.stringify({name , email , password})
    });
    if(data.token)  setToken(data.token);
    return data;
}

export async function login(email: string, password: string) {
    const data = await apiFetch("/auth/login", {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (data.token) setToken(data.token);
    return data;
}

export async function  getMe() {
    return apiFetch('/auth/me')
}


export async function getProjects() {
   const data = await apiFetch("/projects")
   return data.projects ?? []
}

export async function createProject(name : string) {
    return apiFetch("/projects" ,  {
        method : 'POST',
        body : JSON.stringify({name})
    })
}

export async function deleteProject(id : string) {
    return apiFetch(`/projects/${id}` , {
        method : 'DELETE',
    })
}

export async function getFiles(projectId : string) {
    return apiFetch(`/projects/${projectId}/files`)
}

export async function upsertFile(projectId : string, path : string , content : string) {
    return apiFetch(`/projects/${projectId}/files` ,  {
        method : 'PUT',
        body : JSON.stringify({projectId , path , content})
    })
}

export async function deleteFile(projectId : string, path : string) {
    return apiFetch(`/projects/${projectId}/files`, {
        method : 'DELETE',
        body : JSON.stringify({path})
    })
}

export async function getMessages(projectId : string) {
    return apiFetch(`/projects/${projectId}/messages`)
}

export async function sendMessages(projectId : string, message : string) {
    return apiFetch(`/projects/${projectId}/messages` , {
        method : 'POST',
        body : JSON.stringify({projectId ,message})
    })
}

export async function startSandbox(projectId: string) {
    return apiFetch(`/projects/${projectId}/start`, {
        method: 'POST',
    });
}

