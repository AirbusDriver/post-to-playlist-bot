import { TrackInfo }                     from "@/music/types";
import Snoowrap                          from "snoowrap";
import { RedditError, RedditErrorTypes } from "./errors";


export type RedditConfig = {
    clientSecret: string;
    clientId: string;
    username: string;
    password: string;
    userAgent: string
}


export type SubmissionSummary = Pick<Snoowrap.Submission,
    "id" | "title" | "permalink" | "created_utc" | "score" | "upvote_ratio">


export type TrackSubmissionSummary = {
    submission: SubmissionSummary;
    trackInfo: TrackInfo,
}

export interface ListingOptions {
    limit?: number;
    after?: string;
    before?: string;
    show?: string;
    count?: number;
}

export type ListingTimes = "all" | "year" | "month" | "week" | "day"

export type TimeFrameListing = "top"

export type NonTimeFrameListing = "hot" | "new" | "rising"


export { RedditErrorTypes, RedditError };