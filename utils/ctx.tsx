import { use, createContext, type PropsWithChildren, useEffect } from "react";
import { useStorageState } from "./useStorageState";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

const AuthContext = createContext<{
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string) => Promise<{ error?: string }>;
    signInWithApple: () => Promise<{ error?: string }>;
    verifyOTP: (email: string, token: string) => Promise<{ error?: string }>;
    resendOTP: (email: string) => Promise<{ error?: string }>;
    fakeSignIn: () => Promise<void>;
    signOut: () => Promise<void>;
    session?: Session | null;
    isLoading: boolean;
}>({
    signIn: async () => ({ error: "Not implemented" }),
    signUp: async () => ({ error: "Not implemented" }),
    signInWithApple: async () => ({ error: "Not implemented" }),
    verifyOTP: async () => ({ error: "Not implemented" }),
    resendOTP: async () => ({ error: "Not implemented" }),
    fakeSignIn: async () => { },
    signOut: async () => { },
    session: null,
    isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
    const value = use(AuthContext);
    if (!value) {
        throw new Error("useSession must be wrapped in a <SessionProvider />");
    }

    return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
    const [[isLoading, session], setSession] = useStorageState("session");

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session ? JSON.stringify(session) : null);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session ? JSON.stringify(session) : null);
            }
        );

        return () => subscription.unsubscribe();
    }, [setSession]);

    const parsedSession = session ? JSON.parse(session) : null;

    return (
        <AuthContext
            value={{
                signIn: async (email: string, password: string) => {
                    const { error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });
                    return { error: error?.message };
                },
                signUp: async (email: string, password: string) => {
                    const { error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo: undefined, // Disable email confirmation link
                        }
                    });
                    return { error: error?.message };
                },
                signInWithApple: async () => {
                    if (Platform.OS !== 'ios') {
                        return { error: 'Apple Sign In is only available on iOS devices' };
                    }

                    try {
                        const credential = await AppleAuthentication.signInAsync({
                            requestedScopes: [
                                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                                AppleAuthentication.AppleAuthenticationScope.EMAIL,
                            ],
                        });

                        if (credential.identityToken) {
                            const { error } = await supabase.auth.signInWithIdToken({
                                provider: 'apple',
                                token: credential.identityToken,
                            });
                            return { error: error?.message };
                        } else {
                            return { error: 'No identity token received from Apple' };
                        }
                    } catch (e: any) {
                        if (e.code === 'ERR_REQUEST_CANCELED') {
                            return { error: 'Apple Sign In was canceled' };
                        }
                        return { error: e.message || 'Apple Sign In failed' };
                    }
                },
                verifyOTP: async (email: string, token: string) => {
                    const { error } = await supabase.auth.verifyOtp({
                        email,
                        token,
                        type: 'signup'
                    });
                    return { error: error?.message };
                },
                resendOTP: async (email: string) => {
                    const { error } = await supabase.auth.resend({
                        type: 'signup',
                        email
                    });
                    return { error: error?.message };
                },
                signOut: async () => {
                    await supabase.auth.signOut();
                },
                fakeSignIn: async () => {
                    // Create a fake session that mimics Supabase session structure
                    const fakeSession = {
                        access_token: 'fake-access-token-' + Date.now(),
                        refresh_token: 'fake-refresh-token-' + Date.now(),
                        expires_in: 3600,
                        expires_at: Math.floor(Date.now() / 1000) + 3600,
                        token_type: 'bearer',
                        user: {
                            id: 'fake-user-id-' + Date.now(),
                            aud: 'authenticated',
                            role: 'authenticated',
                            email: 'demo@example.com',
                            email_confirmed_at: new Date().toISOString(),
                            phone: '',
                            last_sign_in_at: new Date().toISOString(),
                            app_metadata: {
                                provider: 'fake',
                                providers: ['fake']
                            },
                            user_metadata: {
                                name: 'Demo User'
                            },
                            identities: [],
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        }
                    };
                    
                    // Set the fake session directly
                    setSession(JSON.stringify(fakeSession));
                },
                session: parsedSession,
                isLoading,
            }}
        >
            {children}
        </AuthContext>
    );
}
