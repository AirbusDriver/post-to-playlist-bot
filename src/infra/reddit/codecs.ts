import * as P                                              from "purify-ts";
import { ListingOptions, RedditConfig, SubmissionSummary } from "./types";


export const redditConfigCodec: P.Codec<P.FromType<RedditConfig>> = P.Codec.interface({
    clientSecret: P.string,
    clientId: P.string,
    username: P.string,
    password: P.string,
    userAgent: P.string,
});


export const submissionSummaryCodec: P.Codec<P.FromType<SubmissionSummary>> = P.Codec.interface({
    id: P.string,
    title: P.string,
    created_utc: P.number,
    permalink: P.string,
    score: P.number,
    upvote_ratio: P.number,
});


export const listingOptionsCodec: P.Codec<P.FromType<ListingOptions>> = P.Codec.interface({
    limit: P.optional(P.number),
    after: P.optional(P.string),
    show: P.optional(P.string),
    before: P.optional(P.string),
    count: P.optional(P.number),
});