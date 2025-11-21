import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';

// ENV access url
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
    // Throw error when no base url is set
    console.error("EXPO_PULIC_API_URL is not defined! API calls will fail.");
}

// Expected API response structure
interface LoginResponse {
    access_token: string;
    email: string;
    sub: number;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    phone: string;
}

export interface UserProfile {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    birthDate: string;
    phone: string;
}

export interface UpdateProfileData {
    firsName?: string;
    lastName?: string;
    birthDate?: string;
    phone?: string;
}

// Instance setup
const API: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor for Auth token
API.interceptors.request.use(
    async (config) => {
        // Get the stored token
        const token = await AsyncStorage.getItem('userToken');
        if (token) {
            // Inject bearer
            config.headers.Authorization = `Bear ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const AuthAPI = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        // Endpoints are relative to API_BASE_URL
        const response = await API.post<LoginResponse>('/auth/login', { email, password });
        return response.data;
    },

    signup: async (data: RegisterData): Promise<LoginResponse> => {
        const response = await API.post<LoginResponse>('/auth/register', data);
        return response.data;
    },
};

export const ProfileAPI = {
    // Fetch user data of current logged in user
    fetchProfile: async (): Promise<UserProfile> => {
        // Assuming backend uses the token to identify the user
        const response = await API.get<UserProfile>('/profile');
        return response.data;
    },

    // Updates the profile details
    updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
        const response = await API.patch<UserProfile>('/profile', data);
        return response.data;
    },
}