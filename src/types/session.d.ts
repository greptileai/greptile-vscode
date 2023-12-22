import { Chat, Message, RepositoryInfo } from "./chat";

export enum Membership {
    Free = "free",
    Pro = "pro",
    Business = "business"
}

export type Session = {
    state?: {
        url: string;
        repo: string;
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
        /** Oauth access token */
        token?: string;
        refreshToken?: string;
        checkoutSession?: string;
        business?: boolean;
        freeTrialDaysRemaining?: number;
    };
};
