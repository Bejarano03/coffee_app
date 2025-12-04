
// Define the shape of the Auth Context
export interface AuthContextType {
    session: string | null;
    user: JwtPayload | null;
    isLoading: boolean;
    requiresPasswordReset: boolean;
    signIn: (token: string, payload: JwtPayload, options?: AuthStateOptions) => Promise<void>;
    signOut: () => Promise<void>;
    signUp: (token: string, payload: JwtPayload, options?: AuthStateOptions) => Promise<void>;
    markPasswordResetComplete: () => Promise<void>;
}

export interface AuthStateOptions {
    requiresPasswordReset?: boolean;
}

// Define the expected user data (based on JWT payload)
export interface JwtPayload {
    email: string;
    sub: number;
}
