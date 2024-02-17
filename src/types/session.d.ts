import { Chat, Message, RepositoryInfo } from "./chat";

export enum Membership {
    Free = "free",
    Pro = "pro",
    Student = "student"
}

export type Session = {
    state?: {
        url: string;
        repo: string;
        branch?: string;
        repoUrl: string;
        repoInfo?: RepositoryInfo;
        chat?: Chat;
        messages: Message[];
        isStreaming: boolean;
        input: string;
    },
    user: {
        userId?: string;
        membership?: Membership | undefined;
        checkoutSession?: string;
        business?: boolean;
        freeTrialDaysRemaining?: number;

        /** Oauth access token */
        tokens: ExternalTokens;
        // the last OAuth provider used to sign in
        authProvider: string 
    };
}

interface ExternalTokens {
    [key: string]: {
        accessToken: string;
        idToken?: string;
        refreshToken?: string;
    };
}
