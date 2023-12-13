export enum Membership {
    Free = "free",
    Pro = "pro",
    Business = "business"
}

export type Session = {
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