
// Define the shape of the Auth Context
export interface AuthContextType {
    session: string | null;
    user: JwtPayload | null;
    isLoading: boolean,
    signIn: (token: string, payload: JwtPayload) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (token: string, payload: JwtPayload) => Promise<void>;
}

// Define the expected user data (based on JWT payload)
export interface JwtPayload {
    email: string;
    sub: number;
}